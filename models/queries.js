var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

function homepageQuery(studentID,courseID,callback){

  console.log(userID);
  console.log(courseID);

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
        mongo.getHomeUpdates(callback);
    }
  ],
  function(err, data) {
    console.log(err);
    console.log(data);
    var badges =  data[1][1];
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
    callback(data[0],data[1][0], awarded_badge_ids, data[2][0], data[2][1], data[3]);
  });
}

function badgesQuery(studentID,courseID,callback){
  asyncStuff.series([
    function(callback){
        canvas.getIndScoreAndBadges(studentID, courseID, callback);
    }
  ],
  function(err, data) {
    callback(data[0][1]);
  });
}

module.exports = {
  homepageQuery,
  badgesQuery,
}
