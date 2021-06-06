const cron = require("node-cron"),
  mongo = require("../models/mongo"),
  config = require("./config");

// min hour dom month dow"0 0 * * mon,tue,wed,thur,fri"
cron.schedule("0 0 * * mon,tue,wed,thur,fri", () => {
  Object.keys(config.mongoDBs).map((courseID) => {
    mongo.getDailyTasks(courseID, (err, data) => {
      if (err) console.log("Error setting daily task.");
      else {
        const todaysDaily = data.pop(); // Todays daily is last in sorted order in mongo
        const newDaily = (todaysDaily.position % data.length) + 1;
        mongo.updateTodaysDaily(courseID, newDaily, (err) => {
          if (err) console.log("Error updating daily task");
          else console.log(`Daily task for course ${courseID} successfully updated`);
        });
      }
    });
  });
});
