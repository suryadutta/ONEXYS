var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var queries = require('../models/queries')

router.use('/', function(req, res, next) {

  var courseID = req.cookie.course_id
  var userID = req.cookie.user_id

  if (courseID == 10184){
    courseID = 9659;
  }

  if (req.cookie.admin){
    queries.badgesAdminQuery(courseID, function(badges){
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
