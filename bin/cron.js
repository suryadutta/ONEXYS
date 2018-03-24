var config = require('./config');
var request = require('request');
var asyncStuff = require('async');
var database = require('../models/database');
var canvas = require('../models/canvas');

courseID = 9659;

var assignment_url = (courseID) => {
  return config.canvasURL + 'api/v1/courses/' + courseID + '/students/submissions?student_ids[]=all&grouped=true&per_page=100'
};

function computeScoreAndBadges(submissions, callback) {
  var badges = database.badge_info;
  var totalPoints = 0;
  var quizzes_attempted = 0;
  var daily_done = 0;
  var reflections_done = 0;

  function awardBadge(badgeID) {
    badge_info = database.badge_info.find(badge => badge.ID === badgeID);
    totalPoints += badge_info.Points;
    badges[badges.indexOf(badge_info)].Awarded = true;
  }

  for (var i = 0; i < database.quiz_info.length; i++) {
    try {
      var quiz_grade = (submissions.find(assignment => assignment.assignment_id === (database.quiz_info[i]).assignment_id)).grade;
      if (quiz_grade > 0) {
        quizzes_attempted += 1
      }
    } catch (err) {
      //console.log('Quiz Not Found')
    }
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
  //ALEKS objectives proficient

  //Daily Yalie questions
  for (var i = 0; i < database.daily_yalie_info.length; i++) {
    try {
      var daily_grade = submissions.find(daily => daily.assignment_id === (database.daily_yalie_info[i]).assignment_id).grade;
      if (daily_grade == 100) {
        daily_done += 1
      }
    } catch (err) {
      //console.log(submissions.length);
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

  //number of reflections
  for (var i = 0; i < database.reflections_info.length; i++) {
    try {
      var reflection_grade = submissions.find(assignment => assignment.assignment_id === (database.reflections_info[i]).assignment_id).grade;
      if (reflection_grade == 100) {
        reflections_done += 1
      }
    } catch (err) {
      //console.log('Reflection Not Found')
    }
  }
  totalPoints += (reflections_done * 100);
  //assign points for each badge earned
  if (reflections_done >= 1) {
    awardBadge(28)
  }
  if (reflections_done >= 3) {
    awardBadge(29)
  }
  if (reflections_done >= 7) {
    awardBadge(30)
  }
  if (reflections_done >= 10) {
    awardBadge(31)
  }
  callback(totalPoints, badges);
}

canvas.getRequest(assignment_url(courseID), function(err, users) {
  for (let i = 0; i < users.length; i++) {
    setTimeout(function getInfo() {
      var studentID = users[i].user_id;
      computeScoreAndBadges(users[i].submissions, function(points, badges) {
        var update_url = config.canvasURL + 'api/v1/courses/' + courseID + '/custom_gradebook_columns/' + database.points_id + '/data/' + studentID;
        canvas.putRequest(update_url, {
          column_data: {
            content: points.toString()
          }
        }, function(err, body) {
          //console.log(body);
        });
      });
    }, i * 1000)
  }
});
