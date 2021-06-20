const cron = require("node-cron"),
  mongo = require("../models/mongo"),
  config = require("./config"),
  canvas = require("../models/canvas"),
  assert = require("assert");

/**
 * @description - Cron job to update daily tasks every day of the week at midnight
 * @param {string} - Min Hour Day-of-Month Month Day-of-Week
 * @todo - refactor 10 0 0 * * * mon,tue,wed,thur,fri"
 */
cron.schedule("0 0 0 * * * mon,tue,wed,thur,fri,sat", () => {
  try {
    const today = new Date();
    // Saturday or Sunday
    if (today.getDay() === 7 || today.getDay() === 0) {
      mongo.updateTodaysDaily(courseID, "-1", (err) => console.log(err));
    } else {
      Object.keys(config.mongoDBs).map(async (courseID) => {
        mongo.getDailyTasks(courseID, async (err, daily_tasks) => {
          const dailyTasksIDs = new Set(daily_tasks.map((daily_task) => daily_task.assignment_id)); // HashSet of daily tasks ids
          const assignments = (
            await canvas.getAssignments(courseID, "per_page=125&order_by=due_at")
          ).data; // Get all the courses assignments sorted by earliest future due date; ideally the first one is the next daily task
          const newDaily = assignments.find((assignment) =>
            dailyTasksIDs.has(assignment.id.toString())
          ); // Check if a given assignment is a daily task
          assert(typeof newDaily === "object");
          mongo.updateTodaysDaily(courseID, newDaily.id.toString(), (err) => {
            if (err) throw "Error updating daily task";
            else
              console.log(
                `Daily task for course ${courseID} successfully updated to ${
                  newDaily.id
                } due at ${new Date(newDaily.due_at).toLocaleString()}`
              );
          });
        });
      });
    }
  } catch (e) {
    console.error(e);
    mongo.updateTodaysDaily(courseID, "-1", (err) => {
      if (err) console.log("Error setting the error daily task :(");
      else console.log(`Daily task for course ${courseID} successfully updated to -1`);
    });
  }
});

/**
 * @todo - refactor to use also refactored mongo functions
 * @todo - debug logging system
 * @todo - possible optimzation: store various maps in redis cache
 * @description - https://www.npmjs.com/package/node-cron; runs every 15 minues to update every course's user progress
 */
cron.schedule("*/15 * * * *", async () => {
  Object.keys(config.mongoDBs).map(async (courseID) => {
    let logs = { success: {}, failed: [] };
    try {
      let assignmentIdToType = {}, // Maps a course's modules assignment id to its type - e.g 22657: "practice"
        badgeIdToPoints = {}; // Maps a course's badges id to its points - e.g 1: 200

      const db = mongo.client.db(config.mongoDBs[courseID]),
        userSubmissionsPromise = () =>
          canvas.getSubmissions(
            courseID,
            "student_ids[]=all&workflow_state=graded&grouped=true&per_page=1000" // Get submissions grouped by user - e.g [{user_id:1, submissions: []}, ...]
          ),
        modulesPromise = () => db.collection("modules").find().sort({ _id: 1 }).toArray(),
        dailyTasksPromise = () => db.collection("daily_task").find().sort({ _id: 1 }).toArray(),
        badgesPromise = () => db.collection("badges").find().sort({ _id: 1 }).toArray();

      // Retrieve all necessary information at once
      const [userSubmissions, modules, daily_tasks, badges] = await Promise.allSettled([
        userSubmissionsPromise(),
        modulesPromise(),
        dailyTasksPromise(),
        badgesPromise(),
      ]);

      // Initialize maps to each value
      modules.value.map((module) => {
        assignmentIdToType[module.practice_link] = { type: "practice", moduleID: module._id };
        assignmentIdToType[module.quiz_link] = { type: "apply", moduleID: module._id };
        assignmentIdToType[module.reflection_link] = { type: "reflection", moduleID: module._id };
      });
      daily_tasks.value.map((daily) => {
        assignmentIdToType[daily.assignment_id] = { type: "daily" };
      });
      badges.value.map((badge) => {
        badgeIdToPoints[badge._id] = parseInt(badge.Points);
      });

      // Iterate through each user
      userSubmissions.value.map(async (user, index) => {
        // Get submissions grouped by user
        if (user.submissions.length > 0) {
          let score = 0, // User score
            completed = {
              // Number of completed assignments
              practice: 0,
              apply: 0,
              reflection: 0,
              daily: 0,
            };
          const userProgress = await db // Get current user's progress from MongoDB
            .collection("user_progress")
            .findOne({ user: user.user_id.toString() });

          if (userProgress) {
            user.submissions.map(async (submission) => {
              const moduleID = assignmentIdToType[submission.assignment_id].moduleID; // Map current submission id to moduleID
              logs.success[user.user_id] = { practice: [], apply: [], daily: [], reflection: [] };

              switch (assignmentIdToType[submission.assignment_id].type) {
                case "practice":
                  // Hard-coded to 90 for now
                  if (submission.score >= 90) {
                    score += 100;
                    completed.practice += 1;
                    // If submission not already stored in MongoDB
                    if (!userProgress.modules || !(moduleID in userProgress.modules)) {
                      logs.success[user.user_id].practice.push(submission.assignment_id);
                      await db.collection("user_progress").updateOne(
                        { user: user.user_id.toString() },
                        {
                          $set: { [`modules.${moduleID}.practice`]: true },
                        },
                        { upsert: true }
                      );
                    }
                  }
                  break;
                case "apply":
                  if (submission.score >= 90) {
                    score += 100;
                    completed.apply += 1;
                    if (!userProgress.modules || !(moduleID in userProgress.modules)) {
                      logs.success[user.user_id].apply.push(submission.assignment_id);
                      await db.collection("user_progress").updateOne(
                        { user: user.user_id.toString() },
                        {
                          $set: { [`modules.${moduleID}.apply`]: true },
                        },
                        { upsert: true }
                      );
                    }
                  }
                  break;
                case "daily":
                  logs.success[user.user_id].daily.push(submission.assignment_id);
                  score += 100;
                  completed.daily += 1;
                  break;
                case "reflection":
                  logs.success[user.user_id].reflection.push(submission.assignment_id);
                  score += 100;
                  completed.reflection += 1;
                  break;
                default:
                  console.log(`Assignment ${submission.assignment_id} not stored in Mongo`);
              }

              // Get earned badges, see in canvas.js
              const earned = await canvas.updateBadgeProgress(
                courseID,
                user.user_id,
                userProgress,
                completed
              );
              earned.map((badge) => (score += badgeIdToPoints[badge])); // Add badges points

              await db.collection("user_progress").updateOne(
                { user: user.user_id.toString() },
                {
                  $set: { score },
                },
                { upsert: true }
              );
            });
          }
        }
        if (index === userSubmissions.value.length - 1) {
          console.log(
            `Sucessfully updated new user progression of ${
              Object.keys(logs.success).length
            } out of ${Object.keys(logs.success).length + logs.failed.length} students`
          );
          console.log(
            `Changes: ${JSON.stringify(
              logs.success,
              (key, value) => {
                if (
                  typeof key === "string" &&
                  Object.keys(value).length === 4 &&
                  value.practice.length === 0 &&
                  value.apply.length === 0 &&
                  value.daily.length === 0 &&
                  value.reflection.length === 0
                )
                  return undefined;
                return value;
              },
              2
            )}`
          );
          // console.log(`Failed: ${JSON.stringify(logs.failed, null, 2)}`);
        }
      });
    } catch (e) {
      console.error(e);
      logs.failed.push(e);
    }
  });
});
