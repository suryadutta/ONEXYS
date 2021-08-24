const cron = require("node-cron"),
  mongo = require("../models/mongo"),
  config = require("./config"),
  canvas = require("../models/canvas"),
  assert = require("assert"),
  { diff, addedDiff } = require("deep-object-diff");

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
 * @description - Handles badges 22-26; runs everyday at midnight to update every course's badges related to Top scores and Earliest Time Completed
 */
cron.schedule("0 0 0 * * *", async () => {
  Object.keys(config.mongoDBs).map(async (courseID) => {
    console.log(`Updating ${config.mongoDBs[courseID]}'s badges`);
    try {
      const assignmentIdToType = {}, // Maps a course's modules assignment id to its type - e.g 22657: "practice"
        badgeIdToPoints = {}, // Maps a course's badges id to its points - e.g 1: 200
        badgeLeaderboard = {};
      const db = mongo.client.db(config.mongoDBs[courseID]),
        submissionsPromise = () =>
          canvas.getSubmissions(
            courseID,
            "student_ids[]=all&workflow_state=graded&order=graded_at&per_page=1000" // Ordered by submission time to locate earliest submitted assignments
          ),
        modulesPromise = () => db.collection("modules").find().sort({ _id: 1 }).toArray(),
        badgesPromise = () => db.collection("badges").find().sort({ _id: 1 }).toArray();
      // Retrieve all necessary information at once

      const [submissions, modules, badges] = await Promise.allSettled([
        submissionsPromise(),
        modulesPromise(),
        badgesPromise(),
      ]);

      // Initialize maps to each value
      modules.value.map((module) => {
        assignmentIdToType[module.practice_link] = {
          type: "practice",
          moduleID: module._id,
        };
        assignmentIdToType[module.quiz_link] = {
          type: "apply",
          moduleID: module._id,
        };
        assignmentIdToType[module.reflection_link] = { type: "reflection", moduleID: module._id };

        // initialize leaderboard mapping module id to leaderboard
        badgeLeaderboard[module._id] = {
          earliestPractice: "",
          earliestApply: "",
          earliestReflection: "",
          practiceTopTen: [],
          applyTopTen: [],
        };
      });
      badges.value.map((badge) => {
        badgeIdToPoints[badge._id] = parseInt(badge.Points);
      });

      for (const submission of submissions.value) {
        const assignmentType = assignmentIdToType[submission.assignment_id];
        if (!assignmentType) continue;
        switch (assignmentType.type) {
          case "practice": {
            const moduleID = assignmentType.moduleID;
            const module = modules.value.find((module) => module._id === moduleID);
            // Since it's ordered by submission time, the first one to fill it will be the earliest one
            if (
              badgeLeaderboard[moduleID].earliestPractice === "" &&
              submission.score >= module.practice_cutoff
            )
              badgeLeaderboard[moduleID].earliestPractice = submission.user_id.toString();

            badgeLeaderboard[moduleID].practiceTopTen.push({
              userID: submission.user_id.toString(),
              score: submission.score,
            });
          }
          case "apply": {
            const moduleID = assignmentType.moduleID;
            const module = modules.value.find((module) => module._id === moduleID);
            if (
              badgeLeaderboard[moduleID].earliestApply === "" &&
              submission.score >= module.quiz_cutoff
            )
              badgeLeaderboard[moduleID].earliestApply = submission.user_id.toString();
            badgeLeaderboard[moduleID].applyTopTen.push({
              userID: submission.user_id.toString(),
              score: submission.score,
            });
          }
          case "reflection": {
            const moduleID = assignmentType.moduleID;
            badgeLeaderboard[moduleID].earliestReflection = submission.user_id.toString();
          }
        }
      }

      Object.keys(badgeLeaderboard).map((moduleID) => {
        badgeLeaderboard[moduleID].practiceTopTen.sort(
          (submission1, submission2) => submission2.score - submission1.score
        );
        badgeLeaderboard[moduleID].applyTopTen.sort(
          (submission1, submission2) => submission2.score - submission1.score
        );
        badgeLeaderboard[moduleID].practiceTopTen = badgeLeaderboard[moduleID].practiceTopTen.slice(
          0,
          10
        );
        badgeLeaderboard[moduleID].applyTopTen = badgeLeaderboard[moduleID].applyTopTen.slice(
          0,
          10
        );
      });

      Object.values(badgeLeaderboard).map(
        async ({
          earliestPractice,
          earliestApply,
          earliestReflection,
          practiceTopTen,
          applyTopTen,
        }) => {
          await mongo.updateUserProgressField(
            courseID,
            earliestPractice.toString(),
            "$set",
            `badges.${badgeRequirements.first_practice[0].id}.has`,
            true
          );
          await mongo.updateUserProgressField(
            courseID,
            earliestApply.toString(),
            "$set",
            `badges.${badgeRequirements.first_quiz[0].id}.has`,
            true
          );
          await mongo.updateUserProgressField(
            courseID,
            earliestReflection.toString(),
            "$set",
            `badges.${badgeRequirements.first_reflection[0].id}.has`,
            true
          );

          practiceTopTen.map(async (user) => {
            await mongo.updateUserProgressField(
              courseID,
              user.userID.toString(),
              "$set",
              `badges.${badgeRequirements.top_ten_practice[0].id}.has`,
              true
            );
          });

          applyTopTen.map(async (user) => {
            await mongo.updateUserProgressField(
              courseID,
              user.userID.toString(),
              "$set",
              `badges.${badgeRequirements.top_ten_practice[0].id}.has`,
              true
            );
          });
        }
      );

      console.log(`Finished ${config.mongoDBs[courseID]}'s badges`);
    } catch (e) {
      console.error(e);
    }
  });
});

/**
 * @todo - possible optimzation: store various maps in redis cache
 * @description - https://www.npmjs.com/package/node-cron; runs every 15 minues to update every course's user progress
 */
cron.schedule("*/15 * * * *", async () => {
  Object.keys(config.mongoDBs).map(async (courseID) => {
    try {
      console.log(`Updating ${config.mongoDBs[courseID]}'s user progress`);
      const logs = {};
      const assignmentIdToType = {}, // Maps a course's modules assignment id to its type - e.g 22657: "practice"
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
      badges.value.map((badge) => (badgeIdToPoints[badge._id] = parseInt(badge.Points)));

      // Iterate through each user
      for (const user of userSubmissions.value) {
        if (user.submissions.length <= 0) continue;

        // Number of completed assignments
        const completed = {
            practice: 0,
            apply: 0,
            reflection: 0,
            daily: 0,
          },
          userProgress = await db // Get current user's progress from MongoDB
            .collection("user_progress")
            .findOne({ user: user.user_id.toString() });

        if (!userProgress) continue;

        await updateModuleProgress(
          courseID,
          assignmentIdToType,
          modules.value,
          userProgress,
          user.submissions,
          completed,
          logs
        );

        await updateBadgeProgress(courseID, userProgress, completed, logs);

        await updateUserScore(courseID, userProgress.user, completed, badgeIdToPoints);
      }
      console.log(`Finished updating ${config.mongoDBs[courseID]}`, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  });
});

/**
 * @description - Updates the user's module progress from the diff between the progress based on Canvas submissions and progress in MongoDB. Updates `completed` to contain the number of assignments completed by type. Returns `score` earned by module progress.
 * @param {string} courseID
 * @param {Object} assignmentIdToType - Maps assignment id to the type
 * @param {Array} modules - Array of modules from Mongo
 * @param {Object} userProgress - User progress object from Mongo
 * @param {Array} submissions - Array of submitted assignments from Canvas
 * @param {Object} completed - Object mapping assignment type to number completed
 * @param {Object} logs
 * @return {number} - calculated score earned from completed assignments
 */
async function updateModuleProgress(
  courseID,
  assignmentIdToType,
  modules,
  userProgress,
  submissions,
  completed,
  logs
) {
  try {
    const moduleProgress = {};
    for (const submission of submissions) {
      if (!(submission.assignment_id in assignmentIdToType)) continue;
      switch (assignmentIdToType[submission.assignment_id].type) {
        case "practice": {
          const moduleID = assignmentIdToType[submission.assignment_id].moduleID; // Map current submission id to moduleID
          const module = modules.find((module) => module._id === moduleID);
          const subject = assignmentIdToType[submission.assignment_id].subject;
          if (submission.score >= module.practice_cutoff) {
            completed.practice += 1;
            moduleID in moduleProgress
              ? (moduleProgress[moduleID].practice = true)
              : (moduleProgress[moduleID] = { practice: true });
            if (subject) completed[subject] = completed[subject] + 1 || 1;
          }
          break;
        }
        case "apply": {
          const moduleID = assignmentIdToType[submission.assignment_id].moduleID; // Map current submission id to moduleID
          const module = modules.find((module) => module._id === moduleID);
          const subject = assignmentIdToType[submission.assignment_id].subject;
          if (submission.score >= module.quiz_cutoff) {
            completed.apply += 1;
            moduleID in moduleProgress
              ? (moduleProgress[moduleID].apply = true)
              : (moduleProgress[moduleID] = { apply: true });
            if (subject) completed[subject] = completed[subject] + 1 || 1;
          }
          break;
        }
        case "daily":
          completed.daily += 1;
          break;
        case "reflection":
          completed.reflection += 1;
          break;
        default:
          console.log(`Assignment ${submission.assignment_id} not stored in Mongo`);
      }
    }
    // if there is a diff, then update user progress
    const moduleDiff = diff(userProgress.modules, moduleProgress); // https://www.npmjs.com/package/deep-object-diff
    if (Object.keys(moduleDiff).length > 0) {
      await mongo.updateUserProgressField(
        courseID,
        userProgress.user,
        "$set",
        "modules",
        moduleProgress
      );
      userProgress.user in logs
        ? (logs[userProgress.user].modules = moduleDiff)
        : (logs[userProgress.user] = { modules: moduleDiff });
    }
  } catch (e) {
    console.log(e);
  }
}

// Hard-coded badges
const badgeRequirements = {
  daily: [
    { id: 1, req: 1 },
    { id: 2, req: 5 },
    { id: 3, req: 10 },
    { id: 4, req: 15 },
    { id: 5, req: 20 },
    { id: 6, req: 25 },
  ],
  practice: [
    { id: 7, req: 1 },
    { id: 8, req: 3 },
    { id: 9, req: 7 },
    { id: 10, req: 10 },
  ],
  apply: [
    { id: 11, req: 1 },
    { id: 12, req: 3 },
    { id: 13, req: 7 },
    { id: 14, req: 10 },
  ],
  econ: [{ id: 15, req: 2 }],
  bio: [{ id: 16, req: 2 }],
  chem: [{ id: 17, req: 2 }],
  physics: [{ id: 18, req: 2 }],
  engineering: [{ id: 19, req: 2 }],
  top_ten_practice: [{ id: 20, req: 1 }],
  top_practice: [{ id: 21, req: 1 }],
  top_ten_quiz: [{ id: 22, req: 1 }],
  top_quiz: [{ id: 23, req: 1 }],
  first_quiz: [{ id: 24, req: 1 }],
  first_reflection: [{ id: 25, req: 1 }],
  first_practice: [{ id: 26, req: 1 }],
  reflection: [
    { id: 28, req: 1 },
    { id: 29, req: 3 },
    { id: 30, req: 7 },
    { id: 31, req: 10 },
  ],
  inspirer: [{ id: 32, req: 1 }],
};
/**
 * @param {string} courseID
 * @param {Object} userProgress - User progress object
 * @param {Object} completed - Object mapping assignment type to the number completed for a user
 * @param {Object} badgeIdToPoints - Object mapping badge id to points earned
 * @return {number} - Calculated score earned from badges
 */
async function updateBadgeProgress(courseID, userProgress, completed, logs) {
  try {
    const badgeProgress = {};
    // e.g - [practice, [ { id: 7, req: 1 }, { id: 8, req: 3 }]]
    for (const [type, badges] of Object.entries(badgeRequirements)) {
      badges.map((badge) => {
        // For a given type, if the number completed is greater than the badge req, push
        if (completed[type] >= badge.req) {
          badgeProgress[badge.id] = { has: true };
        }
      });
    }
    const badgeDiff = addedDiff(userProgress.badges, badgeProgress);
    if (Object.keys(badgeDiff).length > 0) {
      Object.key(badgesProgress).map(async (badgeID) => {
        await mongo.updateUserProgressField(
          courseID,
          userProgress.user,
          "$set",
          `badges.${badgeID}.has`,
          badgeProgress[badgeID].has
        );
      });
      userProgress.user in logs
        ? (logs[userProgress.user].badges = badgeDiff)
        : (logs[userProgress.user] = { badges: badgeDiff });
    }
  } catch (e) {
    console.log(e);
  }
}

async function updateUserScore(courseID, userID, completed, badgeIdToPoints) {
  const db = mongo.client.db(config.mongoDBs[courseID]);
  const userProgress = await db // Get current user's progress from MongoDB
    .collection("user_progress")
    .findOne({ user: userID.toString() });
  let score = 0;

  if (userProgress.modules) {
    score += completed.practice * 100;
    score += completed.apply * 100;
    score += completed.reflection * 100;
    score += completed.daily * 100;
  }

  if (userProgress.badges)
    Object.entries(userProgress.badges).map(([badgeID, { has }]) => {
      if (has) score += badgeIdToPoints[badgeID];
    });

  await mongo.updateUserProgressField(courseID, userProgress.user, "$set", "score", score);
}

module.exports = {
  updateBadgeProgress,
  updateModuleProgress,
};
