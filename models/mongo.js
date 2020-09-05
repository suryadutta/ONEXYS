const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var asyncStuff = require('async');
var config = require('../bin/config');

function getData(courseID, collection_name, callback) {
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function (err, client) {
        assert.equal(null, err);
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).find().sort({ "_id": 1 }).toArray(function (error, data) {
            // console.log('DATA')
            // console.log(data)
            callback(error, data);
            client.close();
        });
    });
}

function insertData(courseID, collection_name, data, callback) {
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function (err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).insertOne(data,
            function (err, result) {
                callback(err, result);
                client.close();
            });
    });
}

function updateData(courseID, collection_name, update_index, update_data, callback) {
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function (err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).updateOne(update_index, { $set: update_data },
            function (err, result) {
                callback(err, result);
                client.close();
            });
    });
}

function deleteData(courseID, collection_name, delete_index, callback) {
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function (err, client) {
        var db = client.db(config.mongoDBs[courseID]);
        db.collection(collection_name).deleteOne(delete_index,
            function (err, result) {
                callback(err, result);
                client.close();
            });
    });
}

function getNavigationData(courseID, callback) {
    getData(courseID, 'navigation', function (err, data) {
        nav_info = data.find(document => document.type == 'navigation');
        callback(err, nav_info);
    });
}

function getStaticPage(courseID, targetPage, callback) {
    console.log("getStaticPage() course id: " + courseID)
    getData(courseID, 'navigation', function (err, data) {
        //prevent crashing by rerouting if data comes back empty
        if (data.length) {
            nav_info = data.find(document => document.type == 'navigation');
            callback(err, nav_info[targetPage]);
        }
        else {
            callback(err, null)
        }
    });
}

function getHomeContent(courseID, callback) {
    getData(courseID, 'home', function (err, data) {
        home_updates = data.find(document => document.type == 'updates');
        home_videos = data.filter(document => document.type == 'video');
        home_links = data.filter(document => document.type == 'links')[0];
        home_videos.sort((a, b) => {
            const a_spot = parseInt(a.position),
                b_spot = parseInt(b.position);
            if (a_spot < b_spot) return -1;
            else if (a_spot == b_spot) return 0;
            return 1;
        });
        callback(err, home_updates, home_videos, home_links);
    });
    console.log("getHomeContent() complete")
}

function getModules(courseID, callback) {
    getData(courseID, "home", function (err, data) {
        var updates = data.find(document => document.type == 'updates');
        post_test = updates.post_test;
        post_test_button_background = updates.post_test_button_background;
        pre_test_button_background = updates.pre_test_button_background;

        getData(courseID, "navigation", function (err, data) {
            var nav = data.find(document => document.type == 'navigation');
            post_test_filename = nav.post_test;

            getData(courseID, "modules", function (err, data) {
                callback(err, data, post_test, post_test_filename, post_test_button_background, pre_test_button_background);
            });
        });
    });
}

function getModule(courseID, moduleID, callback) {
    // Use connect method to connect to the server
    var connectionURL = config.mongoURL;
    MongoClient.connect(connectionURL, function (err, client) {
        assert.equal(null, err);
        var db = client.db(config.mongoDBs[courseID]);
        db.collection('modules').findOne({ "_id": parseInt(moduleID) }, function (err, data) {
            function orderVids(a, b) {
                if (a.position < b.position)
                    return -1;
                if (a.position > b.position)
                    return 1;
                return 0;
            }
            if (data.videos) {
                data.videos = data.videos.sort(orderVids);
            }
            callback(err, data);
            client.close();
        });
    });
}

function getAllData(courseID, callback_main) {
    asyncStuff.parallel({
        'modules': function (callback) {
            getData(courseID, 'modules', callback)
        },
        'badges': function (callback) {
            getData(courseID, 'badges', callback)
        },
        'dailies': function (callback) {
            getData(courseID, 'dailies', callback)
        },
        'lucky_bulldogs': function (callback) {
            getData(courseID, 'lucky_bulldogs', callback)
        },
        'home': function (callback) {
            getData(courseID, 'home', callback)
        }
    }, function (err, results) {
        callback_main(results);
    });
}

// Gets the list of daily tasks and executes the callback function
function getDailyTasks(courseID, callback) {
    getData(courseID, 'dailies', callback);
}

// Used to retrieve static course information (logo image, etc)
// selectorDict is used to specify which course you're referring to
function getCourseInfo(selectorDict, callback) {
    MongoClient.connect(config.mongoURL, (err, client) => {
        assert(!err); // Assert the nonexistence of any error
        var db = client.db("shared");
        db.collection("staticInfo").findOne(selectorDict, (err, data) => {
            callback(err, data);
        });
    });
}

//Pull student data down from db
function getStudentData(courseID, collection, callback) {
    getData(courseID, collection, callback)
}

//Update student data
function updateStudentData(courseID, collection, update_index, update_data, callback) {
    updateData(courseID, collection, update_index, update_data, callback)
}

function insertStudentData(courseID, collection, data, callback) {
    insertData(courseID, collection, data, callback)
}

module.exports = {
    getData,
    getAllData,
    insertData,
    updateData,
    deleteData,
    getNavigationData,
    getStaticPage,
    getHomeContent,
    getModules,
    getModule,
    getDailyTasks,
    getCourseInfo,
    getStudentData,
    updateStudentData,
    insertStudentData
}
