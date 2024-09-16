const request = require("request"),
  config = require("../bin/config"),
  mongo = require("./mongo"),
  async = require("async"),
  axios = require("axios");

function registerWebhook(courseID, callback) {
  request.post(
    {
      url: addWebhookURL,
      headers: {
        Authorization: " Bearer " + config.canvasAdminAuthToken,
      },
      ContextID: courseID,
      ContextType: "course",
      EventTypes: ["GRADE_CHANGE"],
      Format: "live-event",
      TransportMetadata: { Url: `https://${config.herokuAppName}.herokuapps.com/gradeChange` },
      TransportType: "https",
    },
    function (error, response, body) {
      console.log("Error", error);
      //console.log("Response", response);
      console.log("Body", body);
      callback(error, body);
    }
  );
}

/**
 * @todo assert input
 * @param {string} courseID
 * @param {string} query
 * @returns {Promise}
 */
function getSections(courseID, query) {
  try {
    const url = `${config.canvasURL}api/v1/courses/${courseID}/sections?${query}`;
    const auth = { Authorization: `Bearer ${config.canvasAdminAuthToken}` };
    return axios.get(url, { headers: auth }).then((res) => res.data);
  } catch (e) {
    console.error(e);
  }
}

async function getSubmissions(courseID, query) {
  try {
    const auth = { Authorization: `Bearer ${config.canvasAdminAuthToken}` };
    const submissions = [];
    let url;
    while (true) {
      url = `${config.canvasURL}api/v1/courses/${courseID}/students/submissions?${query}`;
      const response = await axios.get(url, { headers: auth });
      submissions.push(...response.data);
      /**
       * Canvas responses limit the number of items in each response and returns "links" within the header
       * to the rest of the data
       * <https://example.com>; rel="current",<https://example.com>; rel="next",<https://example.com>; rel="first",<https://example.com>; rel="last"
       *
       */
      const nextString = response.headers.link.split(",").find((link) => link.includes("next"));
      if (nextString) {
        const nextLink = nextString.split(";")[0];
        query = nextLink.substring(1, nextLink.length - 1).split("?")[1];
      } else break;
    }
    return submissions;
  } catch (e) {
    console.error(e);
  }
}

function getEnrollments(courseID, query) {
  try {
    const url = `${config.canvasURL}api/v1/courses/${courseID}/enrollments?${query}`;
    const auth = { Authorization: `Bearer ${config.canvasAdminAuthToken}` };
    return axios.get(url, { headers: auth }).then((res) => res.data);
  } catch (e) {
    console.error(e);
  }
}

function getCourseID(contextID) {
  try {
    const url = `${config.canvasURL}api/v1/courses/lti_context_id:${contextID}`;
    const auth = { Authorization: `Bearer ${config.canvasAdminAuthToken}` };
    return axios.get(url, { headers: auth }).then((res) => res.data);
  } catch (e) {
    console.error(e);
  }
}

function getAssignments(courseID, query) {
  try {
    const url = `${config.canvasURL}api/v1/courses/${courseID}/assignments?${query}`;
    const auth = { Authorization: `Bearer ${config.canvasAdminAuthToken}` };
    return axios.get(url, { headers: auth }).then((res) => res.data);
  } catch (e) {
    console.error(e);
  }
}

// --------------------------
//       User Progress
// --------------------------

/**
 * @param {string} courseID - Canvas Live Event req.body.course_id
 * @param {string} userID - Canvas Live Event req.body.user_id
 * @param {number} score - Canvas Live Event req.body.final_score
 * @param {function} callback
 */
function updateScore(courseID, userID, score, callback) {
  mongo.updateUserProgressField(courseID, userID, "$inc", "score", score, (err) => callback(err));
}

/** TODO: refactor getModule in mongo for here
 * NOT CURRENTLY USED
 * @param {string} courseID - courseID passed from req.session.course_id
 * @param {string} userID - user canvas id
 * @param {string} grade_change - grade_change event object from Canvas Live Event
 * @param {function} callback
 */
function updateModuleProgress(courseID, userID, grade_change, callback) {
  const db = mongo.client.db(config.mongoDBs[courseID]);
  db.collection("modules").findOne(
    {
      $or: [
        { practice_link: grade_change.assignment_id.toString() },
        { quiz_link: grade_change.assignment_id.toString() },
      ],
    },
    (err, moduleCompleted) => {
      if (!moduleCompleted) {
        callback(`Assignment ${grade_change.assignment_id} not in Mongo`);
        return;
      }
      switch (grade_change.assignment_id) {
        case moduleCompleted.practice_link:
          console.log(grade_change.assignment_id);
          if (parseInt(grade_change.grade) >= parseInt(moduleCompleted.practice_cutoff))
            mongo.updateUserProgressBadgeOrModules(
              courseID,
              userID,
              moduleCompleted._id,
              "modules",
              "practice",
              true,
              (err) => {
                if (err) console.log(err);
              }
            );
          else console.log("User's grade was not high enough to pass.");
          break;
        case moduleCompleted.quiz_link:
          if (parseInt(grade_change.grade) >= parseInt(moduleCompleted.quiz_cutoff))
            mongo.updateUserProgressBadgeOrModules(
              courseID,
              userID,
              moduleCompleted._id,
              "modules",
              "apply",
              true,
              (err) => console.log(err)
            );
          else console.log("User's grade was not high enough to pass.");
          break;
        default:
          callback("Error updating user progress");
      }
    }
  );
}

module.exports = {
  registerWebhook,
  updateScore,
  updateModuleProgress,
  getSections,
  getSubmissions,
  getEnrollments,
  getCourseID,
  getAssignments,
};
