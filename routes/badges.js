var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var auth = require('../bin/auth')
var queries = require('../models/queries')

router.use('/', function(req, res, next) {

  var courseID = auth.provider.body.custom_canvas_course_id;
  var userID = auth.provider.body.custom_canvas_user_id;

  if (courseID == 10184){
    courseID = 9659;
  }

  if (auth.provider.admin){
    queries.badgesAdminQuery(function(badges){
      res.render('badges', {
        title: 'Badges | ONEXYS',
        badges: badges,
       });
     });
  }
  
  else{
    queries.badgesQuery(userID, courseID, function(badges){
      res.render('badges', {
        title: 'Badges | ONEXYS',
        badges: badges,
       });
     });
  }
});

module.exports = router;
