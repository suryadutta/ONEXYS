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

function getModule(courseID, moduleID, callback) {
    var db = client.db(config.mongoDBs[courseID]);
    db.collection('modules').findOne({"_id":parseInt(moduleID)}, (err, data) => {
        if (data.videos) {
            data.videos = data.videos.sort( (a, b) => { return (a.position < b.position) ? -1 : 1; });
        }
        callback(err,data);
    });
}
module.exports = {
    client, // Allows ../bin/www to create a shared connection pool

}
