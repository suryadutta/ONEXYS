#!/usr/bin/env node
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load('../');
}

var asyncStuff = require('async');
var config = require('./config');
var mongo = require('../models/mongo');
var canvas = require('../models/canvas');

var assignment_url = (courseID) => {
  return config.canvasURL + 'api/v1/courses/' + courseID + '/students/submissions?student_ids[]=all&grouped=true&per_page=100'
};

var get_update_url = (courseID, callback) => {    
  getAdminRequest(notes_column_url(courseID),function(err,custom_columns){
    var points_id = custom_columns.find(column => column.title='Notes').id;
    var update_url = config.canvasURL + '/api/v1/courses/' + courseID + '/custom_gradebook_columns/' + points_id + '/data/';
    callback(update_url);
  });
}

function computeScoreAndBadges(courseID, studentID, data, callback){ // Return score and badges
  mongo.getAllData(courseID,function(mongo_data){
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
    
    function sortLeaderboardScores(a,b) {
      if (a.score < b.score)
        return 1;
      if (a.score > b.score)
        return -1;
      return 0;
    }

    try {
      //Daily Yalie questions
      for (var i = 0; i < mongo_data.dailies.length; i++) {
        var daily_object = data.find(daily => daily.assignment_id == (mongo_data.dailies[i]).assignment_id);
        if (daily_object){
          var daily_grade = parseFloat(daily_object.grade);
          if (daily_grade == parseFloat(100)) {
            daily_done += 1
          }
        }
      }
      totalPoints += (daily_done * 50); //assign points for each daily
      //assign points for each badge earned
      if (daily_done >= 1) {
        awardBadge(1);
      }
      if (daily_done >= 5) {
        awardBadge(2);
      }
      if (daily_done >= 10) {
        awardBadge(3);
      }
      if (daily_done >= 15) {
        awardBadge(4);
      }
      if (daily_done >= 20) {
        awardBadge(5);
      }
      if (daily_done >= 25) {
        awardBadge(6);
      }

      for (var i = 0; i < mongo_data.modules.length; i++) {
        if (mongo_data.modules[i].open=='true'){
                  
          //practice objectives proficient
          var practice_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).practice_link);
          if (practice_object){
            var practice_grade = parseFloat(practice_object.grade);
            if (practice_grade > parseFloat(mongo_data.modules[i].practice_cutoff)) {

              practice_proficient += 1;

              //Process Practice Leaderboard

              if(mongo_data.modules[i].leaderboard.practice_leaderboard.find(placement => placement.student_id==studentID)){
                //user is already on leaderboard
                awardBadge(20);
                user_index =  mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id==studentID)
                mongo_data.modules[i].leaderboard.practice_leaderboard[user_index] = {
                  'student_id': studentID.toString(),
                  'score': practice_grade
                }
                mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                if(mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                  //user is top on leaderboard
                  awardBadge(21);
                }

              } else {
                // Process leaderboard if not full - add user automatically
                if(mongo_data.modules[i].leaderboard.practice_leaderboard.length<10){
                  mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                    'student_id': studentID.toString(),
                    'score': practice_grade
                  });
                  awardBadge(20);
                  mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                  if(mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                    //user is top on leaderboard
                    awardBadge(21);
                  }
                } else {
                  //user not on full leaderboard - compare scores and update
                  mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                  if (practice_grade > mongo_data.modules[i].leaderboard.practice_leaderboard[mongo_data.modules[i].leaderboard.practice_leaderboard.length-1].score){
                    mongo_data.modules[i].leaderboard.practice_leaderboard.pop()
                    mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                      'student_id': studentID.toString(),
                      'score': practice_grade
                    });
                    awardBadge(20);
                    mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                    if(mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                      //user is top on leaderboard
                      awardBadge(21);
                    }
                  }
                }
              }
            }
          }

          //quizzes attempted
          var quiz_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).quiz_link);
          if (quiz_object){
            var quiz_grade = parseFloat(quiz_object.grade);
            if (quiz_grade > parseFloat(0)) {
              quizzes_attempted += 1;

              //Process Quiz Leaderboard

              if(mongo_data.modules[i].leaderboard.quiz_leaderboard.find(placement => placement.student_id==studentID)){
                //user is already on leaderboard
                awardBadge(22);
                user_index =  mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id==studentID)
                mongo_data.modules[i].leaderboard.quiz_leaderboard[user_index] = {
                  'student_id': studentID.toString(),
                  'score': quiz_grade
                }
                mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                if(mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                  //user is top on leaderboard
                  awardBadge(23);
                }

              } else {
                // Process leaderboard if not full - add user automatically
                if(mongo_data.modules[i].leaderboard.quiz_leaderboard.length<10){
                  mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                    'student_id': studentID.toString(),
                    'score': quiz_grade
                  });
                  awardBadge(22);
                  mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                  if(mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                    //user is top on leaderboard
                    awardBadge(23);
                  }
                } else {
                  //user not on full leaderboard - compare scores and update
                  mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                  if (quiz_grade > mongo_data.modules[i].leaderboard.quiz_leaderboard[mongo_data.modules[i].leaderboard.quiz_leaderboard.length-1].score){
                    mongo_data.modules[i].leaderboard.quiz_leaderboard.pop()
                    mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                      'student_id': studentID.toString(),
                      'score': quiz_grade
                    });
                    awardBadge(22);
                    mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                    if(mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id==studentID)==0){
                      //user is top on leaderboard
                      awardBadge(23);
                    }
                  }
                }
              }
            }
          }

          //number of reflections
          var reflection_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).reflection_link);
          if(reflection_object){
            var reflection_grade = parseFloat(reflection_object.grade);
            if (reflection_grade == parseFloat(100)) {
              reflections_done += 1;
            }
          }
          mongo.updateData(courseID,'modules',{_id:(mongo_data.modules[i])._id},mongo_data.modules[i],function(err,result){});
        } 
      }


      totalPoints += (practice_proficient * 100); //assign points for each proficient ALEKS 
      //assign points for each badge earned
      if (practice_proficient >= 1) {
        awardBadge(7);
      }
      if (practice_proficient >= 3) {
        awardBadge(8);
      }
      if (practice_proficient >= 7) {
        awardBadge(9);
      }
      if (practice_proficient >= 10) {
        awardBadge(10);
      }

      
      totalPoints += (quizzes_attempted * 100); //assign points for each quiz
      //assign points for each badge earned
      if (quizzes_attempted >= 1) {
        awardBadge(11);
      }
      if (quizzes_attempted >= 3) {
        awardBadge(12);
      }
      if (quizzes_attempted >= 7) {
        awardBadge(13);
      }
      if (quizzes_attempted >= 10) {
        awardBadge(14);
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
      console.log('Done with Student '+studentID.toString());
   
    } catch (err) {
      console.log(err);
      callback(err, 0, badges)
    }
  });
}

var updateAllStudentData = function(courseID, callback){
  console.log('Working on Course '+String(courseID));
  canvas.getAdminRequest(assignment_url(courseID), function(err, users) {
    console.log('Updating '+String(users.length)+' Students..');
    for (let i = 0; i < users.length; i++) {
      setTimeout(function () {
        computeScoreAndBadges(courseID, users[i].user_id, users[i].submissions, function(err, totalPoints, badges) {
          get_update_url(courseID, function(update_url){
            update_url = update_url + '/' + studentID;
            putAdminRequest(update_url, {
              column_data: {
                content: totalPoints.toString()
              }
            }, function(err, body) {
              if (err){
                console.log(err);
              }
              callback(null, totalPoints, badges);
            });
          });
        });
      }, i * 1000);
    }
    callback('Done');
  });
}

var courses_array = [38080,38081,38082,38083]

asyncStuff.series([
  function(callback) {
    updateAllStudentData(courses_array[0],callback)
  },
  function(callback) {
    updateAllStudentData(courses_array[1],callback)
  },
  function(callback) {
    updateAllStudentData(courses_array[2],callback)
  },
  function(callback) {
    updateAllStudentData(courses_array[3],callback)
  },
],
// optional callback
function(err, results) {
  console.log('All Done!');
});
