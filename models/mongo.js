// Generate client settings
const MongoClient = require("mongodb").MongoClient,
  mongoSettings = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: 1,
    connectTimeoutMS: 30000,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  },
  assert = require("assert"),
  async = require("async"),
  config = require("../bin/config"),
  client = new MongoClient(config.mongoURL, mongoSettings);

// --------------------------
//          Methods
// --------------------------

function getHomepageUpdates(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("home").findOne({ type: "updates" }, (err, data) => callback(err, data));
}

function updateHomepageUpdates(courseID, field, value, callback) {
  let db = client.db(config.mongoDBs[courseID]),
    submit = {};
  submit[field] = value;
  db.collection("home")
    .findOneAndUpdate({ type: "updates" }, { $set: submit })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function getHomepageVideos(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  async.parallel(
    [
      async.reflect((callback) => {
        db.collection("home")
          .find({ type: "video" })
          .sort({ position: 1 })
          .toArray()
          .then((data) => {
            callback(null, data);
          })
          .catch((err) => {
            callback(err, null);
          });
      }),
      async.reflect((callback) => {
        db.collection("home").findOne({ type: "all-vids" }, (err, data) => {
          callback(err, data);
        });
      }),
    ],
    (err, data) => {
      callback(null, {
        thumbnail: data[1].value.thumbnail,
        playbutton: data[1].value.playbutton,
        videos: data[0].value,
      });
    }
  );
}

function updateVideo(courseID, videoID, setDict, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("home")
    .findOneAndUpdate({ _id: videoID, type: "video" }, { $set: setDict })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function getDailyTasks(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("daily_task")
    .find()
    .toArray()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}

function getModules(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("modules")
    .find()
    .sort({ _id: 1 })
    .toArray()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}

function getModule(courseID, moduleID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("modules").findOne({ _id: parseInt(moduleID) }, (err, data) => {
    if (data.videos)
      data.videos = data.videos.sort((a, b) => {
        return a.position < b.position ? -1 : 1;
      });
    callback(err, data);
  });
}

function getUserProgress(courseID, userID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("user_progress").findOne({ user: parseInt(userID) }, (err, data) =>
    callback(err, data)
  );
}

function getBadges(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("badges")
    .find()
    .toArray()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}

function getNavigationData(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("navigation")
    .find()
    .sort({ page: 1 })
    .toArray()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}

function updateNavigation(courseID, location, link, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("navigation")
    .findOneAndUpdate({ page: location }, { $set: { src: link } })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function updateBadge(courseID, badge, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("badges")
    .findOneAndUpdate(
      {
        _id: badge._id,
      },
      {
        $set: badge,
      }
    )
    .then(() => callback(null))
    .catch((err) => callback(err));
}

module.exports = {
  client, // Allows start.js to create a shared connection pool
  updateVideo,
  updateHomepageUpdates,
  getHomepageUpdates,
  getHomepageVideos,
  getDailyTasks,
  getModule,
  getModules,
  getUserProgress,
  getBadges,
  getNavigationData,
  updateNavigation,
  updateBadge,
};
