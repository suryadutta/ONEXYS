var config = require('../bin/config');
var auth = require('../bin/auth');
var request = require('request');
var asyncStuff = require('async');
var mongo = require('./mongo');

var assignment_user_url = (studentID, courseID) => {
  return config.canvasURL + '/api/v1/courses/' + courseID + '/students/submissions?student_ids[]=' + studentID + '&per_page=' + String(config.canvasPageResults);
}

var update_url = (studentID, courseID) => {
  return config.canvasURL + '/api/v1/courses/' + courseID + '/custom_gradebook_columns/' + config.points_id + '/data/' + studentID;
}

var groups_url = (studentID, courseID) => {
  return config.canvasURL + '/api/v1/courses/' + courseID + '/groups'
}

var group_info_url = (id) => {
  return config.canvasURL + '/api/v1/groups/' + id + '/users'
};

function getRequest(url, callback) {
  auth.getAuthToken(function(auth_token){
    request.get({
      url: url,
      headers: {
        "Authorization": " Bearer " + auth_token,
      },
    }, function(error, response, body) {
      callback(null, JSON.parse(body));
    });
  });
} //user GET request

function postRequest(url, parameters, callback) {
  auth.getAuthToken(function(auth_token){
    request.post({
      url: url,
      headers: {
        "Authorization": " Bearer " + config.canvasAdminAuthToken
      },
      form: parameters,
    }, function(error, response, body) {
      callback(null, JSON.parse(body));
    });
  });
} //user POST request

function putRequest(url, parameters, callback) {
  auth.getAuthToken(function(auth_token){
    request.put({
      url: url,
      headers: {
        "Authorization": " Bearer " + config.canvasAdminAuthToken
      },
      form: parameters,
    }, function(error, response, body) {
      callback(null, JSON.parse(body));
    });
  });
} //user PUT request

function getAdminRequest(url, callback) {
  request.get({
    url: url,
    headers: {
      "Authorization": " Bearer " + config.canvasAdminAuthToken
    },
  }, function(error, response, body) {
    callback(null, JSON.parse(body));
  });
} //admin GET request

function postAdminRequest(url, parameters, callback) {
  request.post({
    url: url,
    headers: {
      "Authorization": " Bearer " + config.canvasAdminAuthToken
    },
    form: parameters,
  }, function(error, response, body) {
    callback(null, JSON.parse(body));
  });
} //admin POST request

function putAdminRequest(url, parameters, callback) {
  request.put({
    url: url,
    headers: {
      "Authorization": " Bearer " + config.canvasAdminAuthToken
    },
    form: parameters,
  }, function(error, response, body) {
    callback(null, JSON.parse(body));
  });
} //admin PUT request

function computeScoreAndBadges(studentID, courseID, callback){ // Return score and badges
  mongo.getAllData(function(mongo_data){
    var badges = mongo_data.badges;
    var totalPoints = 0;
    var practice_proficient = 0;
    var quizzes_attempted = 0;
    var daily_done = 0;
    var reflections_done = 0;

    function awardBadge(badgeID) {
      badge_info = mongo_data.badges.find(badge => badge._id == badgeID);
      totalPoints += badge_info.Points;
      badges[badges.indexOf(badge_info)].Awarded = true;
    }

    getRequest(assignment_user_url(studentID, courseID), function(err, data) {
      if (data.length<1){
        callback(null, 0, badges);
      } else {

        //Daily Yalie questions
        for (var i = 0; i < mongo_data.dailies.length; i++) {
          var daily_object = data.find(daily => daily.assignment_id == (mongo_data.dailies[i]).assignment_id);
          if (daily_object){
            var daily_grade = daily_object.grade;
            if (daily_grade == 100) {
              daily_done += 1
            }
          }
        }
        totalPoints += (daily_done * 50); //assign points for each daily
        //assign points for each badge earned
        if (daily_done >= 1) {
          awardBadge(1)
        }
        if (daily_done >= 5) {
          awardBadge(2)
        }
        if (daily_done >= 10) {
          awardBadge(3)
        }
        if (daily_done >= 15) {
          awardBadge(4)
        }
        if (daily_done >= 20) {
          awardBadge(5)
        }
        if (daily_done >= 25) {
          awardBadge(6)
        }

        for (var i = 0; i < mongo_data.modules.length; i++) {
          if (mongo_data.modules[i].open=='true'){
                    
            //ALEKS objectives proficient
            var practice_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).practice_link);
            if (practice_object){
              var practice_grade = practice_object.grade;
              if (practice_grade > (mongo_data.modules[i]).practice_cutoff) {
                practice_proficient += 1;
              }
            }

            //quizzes attempted
            var quiz_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).quiz_link);
            if (quiz_object){
              var quiz_grade = quiz_object.grade;
              if (quiz_grade > 0) {
                quizzes_attempted += 1;
              }
            }

            //number of reflections
            var reflection_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).reflection_link);
            if(reflection_object){
              var reflection_grade = reflection_object.grade;
              if (reflection_grade == 100) {
                reflections_done += 1;
              }
            }

          } 
        }


        totalPoints += (quizzes_attempted * 100); //assign points for each proficient ALEKS 
        //assign points for each badge earned
        if (practice_proficient >= 1) {
          awardBadge(7)
        }
        if (practice_proficient >= 3) {
          awardBadge(8)
        }
        if (practice_proficient >= 7) {
          awardBadge(9)
        }
        if (practice_proficient >= 10) {
          awardBadge(10)
        }

       
        totalPoints += (quizzes_attempted * 100); //assign points for each quiz
        //assign points for each badge earned
        if (quizzes_attempted >= 1) {
          awardBadge(11)
        }
        if (quizzes_attempted >= 3) {
          awardBadge(12)
        }
        if (quizzes_attempted >= 7) {
          awardBadge(13)
        }
        if (quizzes_attempted >= 10) {
          awardBadge(14)
        }

        totalPoints += (reflections_done * 100);
        //assign points for each badge earned
        if (reflections_done >= 1) {
          awardBadge(28);
        }
        if (reflections_done >= 3) {
          awardBadge(29);
        }
        if (reflections_done >= 7) {
          awardBadge(30);
        }
        if (reflections_done >= 10) {
          awardBadge(31);
        }


        callback(null, totalPoints, badges);
      }

    });
  });
}

function updateCanvas(studentID, courseID, totalPoints, badges, callback) { // Update Canvas custom points column
  putAdminRequest(update_url(studentID, courseID), {
    column_data: {
      content: totalPoints.toString()
    }
  }, function(err, body) {
    callback(null, totalPoints, badges);
  });
}

function getIndScoreAndBadges(studentID, courseID, callback){ // Get score and badge info for user
    computeScoreAndBadges(studentID, courseID, function(err, totalPoints, badges){ //compute scores
        updateCanvas(studentID, courseID, totalPoints, badges, callback); //update Canvas
    });
}

function getStudentProgress(studentID, courseID, callback) { // Get student progress for quizzes and tests (checkboxes)
  mongo.getAllData(function(mongo_data){
    getRequest(assignment_user_url(studentID, courseID), function(err, user_assigments) {
      moduleProgress = mongo_data.modules;
      if (user_assigments.length<1) {
        callback(null, moduleProgress)
      } else {
        //get quiz and aleks progress
        for (var i = 0; i < moduleProgress.length; i++) {
          var module_object = mongo_data.modules.find(module => module._id == i + 1);
          if(module_object.open=='true'){

            //practice progress
            var practice_object = user_assigments.find(assignment => assignment.assignment_id == module_object.practice_link);
            if(practice_object){
              (moduleProgress[i]).practice_progress = practice_object.grade > module_object.practice_cutoff;
            } else {
              (moduleProgress[i]).practice_progress = false;
            }

            //quiz progress
            var quiz_object = user_assigments.find(assignment => assignment.assignment_id == module_object.quiz_link);
            if(quiz_object){
              (moduleProgress[i]).quiz_progress = quiz_object.grade > module_object.quiz_cutoff;
            } else {
              (moduleProgress[i]).quiz_progress = false;
            }

          } 
        }
        callback(null, moduleProgress);
      }
    });
  });
}

function getLeaderboardScores(studentID, courseID, callback) { // get all leaderboard scores

  function mergeLeaderboardArrays(groupNames, scores) { //merge name and score arrays for leaderboard
    var combinedArray = []
    for (var i = 0; i < groupNames.length; i++) {
      combinedArray.push({
        'Name': groupNames[i],
        'Score': scores[i]
      })
    }
    if (groupNames.length < 3){
      fillerArray = Array(3-groupNames.length).fill({'Name': '','Score': 0});
      combinedArray = combinedArray.concat(fillerArray);
    }
    return combinedArray
  }

  /**
  Process to calculate total scores for all teams:
  1. Get all group names and ids for courses (returns array of groups ids and array of group names)
  2. For each group, fetch the corresponding (returns nested array of student ids and array of group names)
  3. Get points for all students from Canvas custom column, map each student id to it's point value, then sum each group array to it's sum (returns array of group scores)
  **/

  asyncStuff.waterfall([
    fetchGroupIDs,
    fetchStudentIDs,
    getTotalScores,
  ], function(err, scores, groupNames, studentIndex) {
    function compare(a, b) {
      if (a.Score < b.Score) return 1;
      if (a.Score > b.Score) return -1;
      return 0;
    }
    callback(err, mergeLeaderboardArrays(groupNames, scores).sort(compare), mergeLeaderboardArrays(groupNames, scores)[studentIndex]);
  });

  function fetchGroupIDs(callback2) {
    getRequest(groups_url(studentID, courseID), function(err, groups) {
      callback2(null, groups.map(group => group.id), groups.map(group => group.name))
    })
  }

  function fetchStudentIDs(groupIDs, groupNames, callback2) {
    asyncStuff.map(groupIDs.map(groupID => group_info_url(groupID)), getAdminRequest, function(err, groupStudentInfo) {
      function findIndexOfUser(studentIdsArrays) {
        for (var i = 0; i < studentIdsArrays.length; i++) {
          var index = studentIdsArrays[i].indexOf(parseInt(studentID));
          if (index > -1) {
            return i
          }
        }
      }
      var studentIdsArrays = groupStudentInfo.map(students => (students.map(student => student.id)));
      var studentIndex = findIndexOfUser(studentIdsArrays)
      callback2(null, studentIdsArrays, groupNames, studentIndex)
    });
  }

  function getTotalScores(studentIdsArrays, groupNames, studentIndex, callback2) {
    var points_url = config.canvasURL + '/api/v1/courses/' + courseID + '/custom_gradebook_columns/' + config.points_id + '/data/?per_page=100'
    getAdminRequest(points_url, function(err, pointsInfo) {

      function getPointValue(studentID) {
        try {
          return parseInt((pointsInfo.find(studentInfo => studentInfo.user_id == studentID)).content);
        } catch (e) {
          return 0;
        }
      }

      var studentPoints = studentIdsArrays.map(studentIds => ((studentIds.map(studentId => getPointValue(studentId))).reduce((a, b) => a + b, 0)));
      callback2(null, studentPoints, groupNames, studentIndex);

    });
  }
}

module.exports = {
  getRequest,
  postRequest,
  putRequest,
  getIndScoreAndBadges,
  getStudentProgress,
  getLeaderboardScores,
}
