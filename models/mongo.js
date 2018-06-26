const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var asyncStuff = require('async');
var config = require('../bin/config');
var auth = require('../bin/auth');

function getData(collection_name, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURLs[auth.provider.body.custom_canvas_course_id]||config.mongoURLs[process.env.TEST_COURSE_NUMBER];
    console.log(connectionURL);
    MongoClient.connect(connectionURL, function(err, db) {
        assert.equal(null, err);
        db.collection(collection_name).find().sort({"_id":1}).toArray(function(err, data) {
            callback(err,data);
            db.close();
        });        
    });   
}

function insertData(collection_name, data, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURLs[auth.provider.body.custom_canvas_course_id]||config.mongoURLs[process.env.TEST_COURSE_NUMBER];
    //console.log('Connecting to: ');
    //console.log(connectionURL);
    MongoClient.connect(connectionURL, function(err, db) {
        db.collection(collection_name).insertOne(data,
            function(err, result) {
                callback(err,result);
                db.close();
          });  
    });   
}

function updateData(collection_name,update_index,update_data, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURLs[auth.provider.body.custom_canvas_course_id]||config.mongoURLs[process.env.TEST_COURSE_NUMBER];
    //console.log('Connecting to: ');
    //console.log(connectionURL);
    MongoClient.connect(connectionURL, function(err, db) {
        db.collection(collection_name).updateOne(update_index, {$set: update_data},
            function(err, result) {
                callback(err,result);
                db.close();
          });  
    });   
}

function deleteData(collection_name,delete_index,callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURLs[auth.provider.body.custom_canvas_course_id]||config.mongoURLs[process.env.TEST_COURSE_NUMBER];
    //console.log('Connecting to: ');
    //console.log(connectionURL);
    MongoClient.connect(connectionURL, function(err, db) {
        db.collection(collection_name).deleteOne(delete_index,
            function(err, result) {
                callback(err,result);
                db.close();
          });  
    });   
}

function getHomeContent(callback){
    getData('home',function(err,data){
        home_updates = data.find(document => document.type == 'updates');
        home_videos = data.filter(document => document.type == 'video');
        home_links = data.filter(document => document.type == 'links')[0];
        callback(err,home_updates,home_videos,home_links);
      });
}

function getModule(moduleID, callback){
    // Use connect method to connect to the server
    var connectionURL = config.mongoURLs[auth.provider.body.custom_canvas_course_id]||config.mongoURLs[process.env.TEST_COURSE_NUMBER];
    console.log('Connecting to: ');
    console.log(connectionURL);
    MongoClient.connect(connectionURL, function(err, db) {
        assert.equal(null, err);
        db.collection('modules').findOne({"_id":parseInt(moduleID)},function(err, data) {
            function orderVids(a,b) {
                if (a.position < b.position)
                  return -1;
                if (a.position > b.position)
                  return 1;
                return 0;
              }
            if (data.videos){
                data.videos = data.videos.sort(orderVids)
            }
            callback(err,data);
            db.close();
        });        
    });   
}

function getAllData(callback_main){
    asyncStuff.parallel({
        'modules': function(callback) {
            getData('modules',callback)
        },
        'badges': function(callback) {
            getData('badges',callback)
        },
        'dailies': function(callback) {
            getData('dailies',callback)
        },
        'lucky_bulldogs': function(callback) {
            getData('lucky_bulldogs',callback)
        },
    }, function(err, results) {
        callback_main(results);
    });
}

module.exports = {
    getData,
    getAllData,
    insertData,
    updateData,
    deleteData,
    getHomeContent,
    getModule,
}