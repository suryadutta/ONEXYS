var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var auth = require('../bin/auth')
var queries = require('../models/queries')
var redis = require('../bin/redis');

router.use('/', function(req, res, next) {

  var userID = auth.provider.body.custom_canvas_user_id;
  var courseID = auth.provider.body.custom_canvas_course_id;

  if (courseID==10184){
    userID = 58644
    courseID = 9659
  }

  queries.homepageQuery(userID,courseID,function(module_progress, score, badges, leaderboard, my_team){

    function orderBadges(a,b) {
      if (a.Points < b.Points)
        return 1;
      if (a.Points > b.Points)
        return -1;
      return 0;
    }

    var awarded_badges = badges.filter(badge => badge.awarded == 'true').sort(orderBadges);

    console.log(awarded_badges);

    res.render('home', {
      title: 'Home | ONEXYS',
      module_progress: module_progress,
      score: score,
      badges: badges, 
      leaderboard: leaderboard,
      my_team: my_team,
     });
   });
   
});

module.exports = router;
