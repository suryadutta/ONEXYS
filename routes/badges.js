var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var canvas = require('../models/canvas')
var queries = require('../models/queries')

router.get('/', function(req, res, next) {


  var userID = auth.provider.body.custom_canvas_user_id;
  var courseID = auth.provider.body.custom_canvas_course_id;

  if (courseID==10184){
    userID = 58644
    courseID = 9659
  }

  queries.badgesQuery(userID, courseID, function(badges){
    res.render('badges', {
      title: 'Badges | ONEXYS',
      badges: badges,
     });
   });
});

module.exports = router;
