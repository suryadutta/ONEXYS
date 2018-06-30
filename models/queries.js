var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

function homepageQuery(studentID,courseID,callback){

  asyncStuff.parallel([
    function(callback) {
      canvas.getStudentProgress(studentID, courseID, callback);
    },
    function(callback){
      canvas.getIndScoreAndBadges(studentID, courseID, callback);
    },
    function(callback){
      canvas.getLeaderboardScores(studentID, courseID, callback);
    },
    function(callback){
      mongo.getHomeContent(courseID, callback);
    },
    function(callback){
      canvas.getNextDailyYalie(courseID, callback);
    }
  ],
  
  function(err, data) {
    
    var module_progress = data[0],
        score = data[1][0],
        badges =  data[1][1],
        leaderboard = data[2][0],
        my_team = data[2][1],
        home_updates = data[3][0],
        home_vids = data[3][1],
        home_links = data[3][2],
        daily_yalie = data[4];

    function orderBadges(a,b) {
      if (a.Points < b.Points)
        return 1;
      if (a.Points > b.Points)
        return -1;
      return 0;
    }

    var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
    var awarded_badge_ids = awarded_badges.map(badge => badge._id);
    if (awarded_badge_ids.length>3){
      awarded_badge_ids = awarded_badge_ids.slice(0,3);
    }
    
    callback(module_progress, score, awarded_badge_ids, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
  });
}

function homepageQueryMasquerade(studentID,courseID,callback){

  asyncStuff.parallel([
    function(callback) {
      canvas.getStudentProgress_masquerade(studentID, courseID, callback);
    },
    function(callback){
      canvas.getIndScoreAndBadges_masquerade(studentID, courseID, callback);
    },
    function(callback){
      canvas.getLeaderboardScores_masquerade(studentID, courseID, callback);
    },
    function(callback){
      mongo.getHomeContent(courseID, callback);
    },
    function(callback){
      canvas.getNextDailyYalie(courseID, callback);
    }
  ],
  
  function(err, data) {
    
    var module_progress = data[0],
        score = data[1][0],
        badges =  data[1][1],
        leaderboard = data[2][0],
        my_team = data[2][1],
        home_updates = data[3][0],
        home_vids = data[3][1],
        home_links = data[3][2],
        daily_yalie = data[4];

    function orderBadges(a,b) {
      if (a.Points < b.Points)
        return 1;
      if (a.Points > b.Points)
        return -1;
      return 0;
    }

    var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
    var awarded_badge_ids = awarded_badges.map(badge => badge._id);
    if (awarded_badge_ids.length>3){
      awarded_badge_ids = awarded_badge_ids.slice(0,3);
    }
    
    callback(module_progress, score, awarded_badge_ids, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
  });
}

function homepageAdminQuery(courseID, callback){

  asyncStuff.parallel([
    function(callback) {
      mongo.getAllData(courseID, function(mongo_data){
        callback(null, mongo_data.modules)
      });
    },
    function(callback){
      canvas.getAdminLeaderboardScores(courseID, callback);
    },
    function(callback){
      mongo.getHomeContent(courseID, callback);
    },
    function(callback){
      canvas.getStudents(courseID,callback);
    },
    function(callback){
      canvas.getNextDailyYalie(courseID, callback);
    }
  ],
  
  function(err, data) {
    
    var module_progress = data[0],
        leaderboard = data[1],
        home_updates = data[2][0],
        home_vids = data[2][1],
        home_links = data[2][2],
        students = data[3],
        daily_yalie=data[4];
    
    callback(module_progress, leaderboard, home_updates, home_vids, home_links, students, daily_yalie);
  });
}

function badgesQuery(studentID,courseID,callback){
  canvas.getIndScoreAndBadges(studentID, courseID, function(err, totalPoints, badges) {
    callback(badges);
  });
}

function badgesAdminQuery(courseID, callback){
  mongo.getAllData(courseID, function(mongo_data){
    callback(mongo_data.badges);
  })
}

module.exports = {
  homepageQuery,
  homepageQueryMasquerade,
  homepageAdminQuery,
  badgesQuery,
  badgesAdminQuery
}
