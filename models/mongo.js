// Generate client settings
const MongoClient = require('mongodb').MongoClient,
      mongoSettings = {
          useNewUrlParser: true,
          keepAlive: 1,
          connectTimeoutMS: 30000,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 1000,
      },
      assert = require('assert'),
      asyncStuff = require('async'),
      config = require('../bin/config'),
      client = new MongoClient(config.mongoURL, mongoSettings);

// --------------------------
//          Methods
// --------------------------

function getData(courseID, collection_name, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection(collection_name).find().sort({"_id":1}).toArray().then( data => {
        callback(null, data);
    }).catch(err => {
        console.log(err);
        callback(err, null);
    });
}

function insertData(courseID, collection_name, data, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection(collection_name).insertOne(data, (err, result) => {
        callback(err,result);
    });
}

function updateData(courseID, collection_name, update_index, update_data, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection(collection_name).updateOne(update_index, {$set: update_data}, (err, result) => {
        callback(err,result);
    });
}

function deleteData(courseID, collection_name, delete_index, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection(collection_name).deleteOne(delete_index, (err, result) => {
        callback(err, result);
    });
}

function getNavigationData(courseID, callback) {
    getData(courseID, 'navigation', (err, data) => {
        nav_info = data.find(document => document.type == 'navigation');
        callback(err, nav_info);
    });
}

function getStaticPage(courseID, targetPage, callback) {
    getData(courseID, 'navigation', (err, data) => {
        nav_info = data.find(document => document.type == 'navigation');
        callback(err, nav_info[targetPage]);
    });
}

function getHomeContent(courseID, callback) {
    getData(courseID, 'home', (err, data) => {
        home_updates = data.find(document => document.type == 'updates');
        home_videos = data.filter(document => document.type == 'video');
        home_links = data.filter(document => document.type == 'links')[0];
        home_videos.sort((a, b) => {
            const a_spot = parseInt(a.position),
                  b_spot = parseInt(b.position);
            // Return sort result with nested ternary
            return (a_spot == b_spot) ? 0 : ((a_spot < b_spot) ? -1 : 1);
        });
        callback(err, home_updates, home_videos, home_links);
    });
}

function getModules(courseID, callback) {
    try {
        getData(courseID, "home", (err, data) => {
            var updates = data.find(document => document.type == 'updates');
            assert(updates);
            post_test = updates.post_test;
            post_test_button_background = updates.post_test_button_background;
            pre_test_button_background = updates.pre_test_button_background;

            getData(courseID, "navigation", (err, data) => {
                var nav = data.find(document => document.type == 'navigation');
                post_test_filename = nav.post_test;

                getData(courseID, "modules", (err, data) => {
                    callback(err, data, post_test, post_test_filename, post_test_button_background, pre_test_button_background);
                });
            });
        });
    } catch(e) {
        console.log("Malformed database!");
    }
}

function getModule(courseID, moduleID, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection('modules').findOne({"_id":parseInt(moduleID)}, (err, data) => {
        if (data.videos) {
            data.videos = data.videos.sort( (a, b) => { return (a.position < b.position) ? -1 : 1; });
        }
        callback(err,data);
    });
}

function getAllData(courseID, callback_main){
    asyncStuff.parallel({
        'modules': callback => {
            getData(courseID, 'modules', callback)
        },
        'badges': callback => {
            getData(courseID, 'badges', callback)
        },
        'dailies': callback => {
            getData(courseID, 'dailies', callback)
        },
        'lucky_bulldogs': callback => {
            getData(courseID, 'lucky_bulldogs', callback)
        },
        'home': callback => {
            getData(courseID, 'home', callback)
        }
    }, (err, results) => {
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
    var db = client.db("shared");
    db.collection("staticInfo").findOne(selectorDict, (err, data) => {
        callback(err, data);
    });
}

module.exports = {
    client, // Allows ../bin/www to create a shared connection pool
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
}
