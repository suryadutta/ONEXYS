// Generate client settings
const MongoClient = require("mongodb").MongoClient,
  mongoSettings = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: 1,
    connectTimeoutMS: 30000,
  },
  assert = require("assert"),
  async = require("async"),
  config = require("../bin/config"),
  client = new MongoClient(config.mongoURL, mongoSettings);

// --------------------------
//        User Creation
// --------------------------

/**
 * @param {string} courseID - courseID passed from req.session.course_id
 * @param {string} userID - user canvas id from POST custom_canvas_user_id
 * @returns {Promise}
 */
function findUser(courseID, userID) {
  try {
    const db = client.db(config.mongoDBs[courseID]);
    return db.collection("user_progress").findOne({ user: userID.toString() });
  } catch (e) {
    console.error(e);
  }
}

/**
 * TODO: refactor
 * @param {string} courseID - courseID passed from req.session.course_id
 * @param {string} userID - user canvas id from POST custom_canvas_user_id
 * @param {function} callback
 * @returns {Promise}
 */
function initUser(courseID, userID) {
  try {
    const db = client.db(config.mongoDBs[courseID]);
    return db
      .collection("user_progress")
      .updateOne(
        { user: userID.toString() },
        { $set: { badges: {}, modules: {}, score: 0, team: "", user: userID.toString() } },
        { upsert: true }
      );
  } catch (e) {
    console.error(e);
  }
}

// --------------------------
//          Methods
// --------------------------
// Need alpha numeric string id starting with letter for videos
function randomString() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 12;
  let result = "";
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

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
    .sort({ _id: 1 })
    .toArray()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}

function getTodaysDaily(courseID) {
  const db = client.db(config.mongoDBs[courseID]);
  return db.collection("global").findOne({ type: "todays_daily" });
}

function getLuckyBonuses(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("lucky_bonuses")
    .find()
    .sort({ _id: 1 })
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

function getProgress(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("user_progress")
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
  db.collection("user_progress").findOne({ user: userID.toString() }, (err, data) =>
    callback(err, data)
  );
}
function getDailyError(courseID, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("global").findOne({ type: "daily-error" }, (err, data) => callback(err, data));
}

function getBadges(courseID, callback) {
  let db = client.db(config.mongoDBs[courseID]);
  db.collection("badges")
    .find()
    .sort({ _id: 1 })
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
    .findOneAndUpdate({ _id: badge._id }, { $set: badge })
    .then(() => callback(null))
    .catch((err) => callback(err));
}
function updateDaily(courseID, daily, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("daily_task")
    .findOneAndUpdate({ _id: daily._id }, { $set: daily })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function updateTodaysDaily(courseID, assignment_id, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("global")
    .findOneAndUpdate({ type: "todays_daily" }, { $set: { assignment_id } })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function updateModule(courseID, module, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("modules")
    .findOneAndUpdate({ _id: module._id }, { $set: module })
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function updateModuleVid(courseID, moduleVid, moduleID, videoID, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("modules")
    .updateOne(
      { _id: parseInt(moduleID), "videos._id": videoID.toString() },
      {
        $set: { "videos.$": moduleVid },
      }
    )
    .then(() => callback(null))
    .catch((err) => callback(err));
}

function addHomeVid(courseID, homeVid, callback) {
  const db = client.db(config.mongoDBs[courseID]);
  db.collection("home")
    .insertOne({
      _id: randomString(),
      src: homeVid.src,
      description: homeVid.description,
      thumbnail: homeVid.thumbnail,
      type: "video",
      position: homeVid.position,
    })
    .then(() => callback(true))
    .catch(() => callback(false));
}

function deleteHomeVid(courseID, vidId, callback) {
  const db = client.db(config.mongoDBs[courseID]);

  db.collection("home")
    .deleteOne({
      _id: vidId,
    })
    .then(() => callback(true))
    .catch(() => callback(false));
}

function updateUserProgressField(courseID, userID, operator, field, value) {
  try {
    const db = client.db(config.mongoDBs[courseID]);
    return db.collection("user_progress").updateOne(
      { user: userID.toString() },
      {
        [operator]: { [field]: value },
      },
      { upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
}

/**
 * @todo - refactor into just one function.
 * @param {string} courseID
 * @param {string} userID
 * @param {string} fieldID - id of corresponding module or badge
 * @param {string} field - modules or badges
 * @param {string} assignmentType - practice or apply
 * @param {string} value - value to set at modules.$.assignmentType
 * @param {function} callback
 */
function updateUserProgressBadgeOrModules(
  courseID,
  userID,
  fieldID,
  field,
  assignmentType,
  value,
  callback
) {
  const db = client.db(config.mongoDBs[courseID]);
  const key = `${field}.${fieldID}.${assignmentType}`;
  console.log(`Updated user ${userID}`);
  db.collection("user_progress")
    .updateOne(
      { user: userID },
      {
        $set: { [key]: value },
      },
      { upsert: true }
    )
    .catch((err) => callback(err));
}

module.exports = {
  client, // Allows start.js to create a shared connection pool
  getHomepageUpdates,
  getHomepageVideos,
  getDailyTasks,
  getTodaysDaily,
  getLuckyBonuses,
  getModule,
  getModules,
  getProgress,
  getUserProgress,
  getDailyError,
  getBadges,
  getNavigationData,
  findUser,
  initUser,
  updateVideo,
  updateHomepageUpdates,
  updateNavigation,
  updateBadge,
  updateModule,
  updateModuleVid,
  addHomeVid,
  deleteHomeVid,
  updateDaily,
  updateTodaysDaily,
  updateUserProgressField,
  updateUserProgressBadgeOrModules,
};
