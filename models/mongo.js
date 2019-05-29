const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var asyncStuff = require('async');
var config = require('../bin/config');

function getData(courseID, collection_name, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function(err, client) {
        assert.equal(null, err);
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).find().sort({"_id":1}).toArray(function(err, data) {
            callback(err,data);
            client.close();
        });
    });
}

function insertData(courseID, collection_name, data, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function(err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).insertOne(data,
            function(err, result) {
                callback(err,result);
                client.close();
          });
    });
}

function updateData(courseID, collection_name, update_index, update_data, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function(err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).updateOne(update_index, {$set: update_data},
            function(err, result) {
                callback(err,result);
                client.close();
          });
    });
}

function deleteData(courseID, collection_name, delete_index,callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function(err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).deleteOne(delete_index,
            function(err, result) {
                callback(err, result);
                client.close();
            });
    });
}

function getHomeContent(courseID, callback){
    getData(courseID, 'home', function(err, data){
        home_updates = data.find(document => document.type == 'updates');
        home_videos = data.filter(document => document.type == 'video');
        home_links = data.filter(document => document.type == 'links')[0];
        callback(err, home_updates, home_videos, home_links);
    });
}

function getModules(courseID, callback){
    console.log("getModules");
    getData(courseID, "home", function(err, data){
        console.log("First get!");
        post_test = data.find(document => document.type == 'updates').post_test;
        console.log("post_test: " + post_test);

        getData(courseID, "modules", function(err, data){
            console.log("Second get! " + post_test);
            callback(err, data, post_test);
        });
    });
}

function getModule(courseID, moduleID, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function(err, client) {
        assert.equal(null, err);
        var db = client.db(config.mongoDBs[courseID]);
        db.collection('modules').findOne({"_id":parseInt(moduleID)},function(err, data) {
            function orderVids(a,b) {
                if (a.position < b.position)
                  return -1;
                if (a.position > b.position)
                  return 1;
                return 0;
            }
            if (data.videos){
                data.videos = data.videos.sort(orderVids);
            }
            callback(err,data);
            client.close();
        });
    });
}

function getAllData(courseID, callback_main){
    asyncStuff.parallel({
        'modules': function(callback) {
            getData(courseID, 'modules', callback)
        },
        'badges': function(callback) {
            getData(courseID, 'badges', callback)
        },
        'dailies': function(callback) {
            getData(courseID, 'dailies', callback)
        },
        'lucky_bulldogs': function(callback) {
            getData(courseID, 'lucky_bulldogs', callback)
        },
    }, function(err, results) {
        callback_main(results);
    });
}

// Gets the list of daily tasks and executes the callback function
function getDailyTasks(courseID, callback) {
    getData(courseID, 'dailies', callback);
}

module.exports = {
    getData,
    getAllData,
    insertData,
    updateData,
    deleteData,
    getHomeContent,
    getModules,
    getModule,
    getDailyTasks,
}
