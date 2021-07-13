const { exception } = require("console");
const cron = require("node-cron"),
  mongo = require("../models/mongo"),
  config = require("./config"),
  canvas = require("../models/canvas"),
  assert = require("assert");

/**
 * @description - Cron job to update daily tasks every day of the week at midnight
 * @param {string} - Second Min Hour Day-of-Month Month Day-of-Week
 * @param {function}
 */
cron.schedule("0 0 0 * * *", () => {
  Object.keys(config.mongoDBs).map(async (courseID) => {
    try {
      const today = new Date();
      if (today.getDay() === 7 || today.getDay() === 0)
        throw `Today is a weekend - setting daily task id to -1`;

      const dailyTasks = await mongo.getDailyTasks(courseID);
      const dailyTaskIDs = dailyTasks.map((daily) => daily.assignment_id); // Array of all daily task ids in MongoDB
      const dailyTaskIDSet = new Set(dailyTaskIDs); // HashSet of daily tasks ids
      const assignments = await canvas.getAssignments(
        courseID,
        "per_page=125&order_by=due_at&bucket=future"
      ); // Get all the courses assignments sorted by earliest future due date
      const newDaily = assignments.find((assignment) =>
        dailyTaskIDSet.has(assignment.id.toString())
      ); // Check if a given assignment is a daily task; ideally the next daily task is the first couple

      assert(typeof newDaily === "object");
      await mongo.updateTodaysDaily(courseID, newDaily.id);
      console.log(`Daily task for course ${config.mongoDBs[courseID]} updated to ${newDaily.name}`);
    } catch (e) {
      console.error(e);
      mongo.updateTodaysDaily(courseID, "-1");
    }
  });
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
        assignmentIdToType[module.practice_link] = {
          type: "practice",
          moduleID: module._id,
          subject: module.subject ? module.subject : null,
        };
        assignmentIdToType[module.quiz_link] = {
          type: "apply",
          moduleID: module._id,
          subject: module.subject ? module.subject : null,
        };
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

              logs.success[user.user_id] = {
                practice: [],
                apply: [],
                daily: [],
                reflection: [],
              };

              switch (assignmentIdToType[submission.assignment_id].type) {
                case "practice":
                  // Hard-coded to 90 for now
                  if (submission.score >= 90) {
                    score += 100;
                    completed.practice += 1;
                    // If submission not already stored in MongoDB

                    try {
                      if (userProgress.modules.moduleID.practice) {
                      }
                    } catch {
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

                    try {
                      if (userProgress.modules.moduleID.apply) {
                      }
                    } catch {
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
