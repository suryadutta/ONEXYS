var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');

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
    }
  ],
  function(err, data) {
    callback(data[0],data[1][0], data[1][1], data[2][0], data[2][1]);
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
