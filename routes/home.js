var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var auth = require('../bin/auth')
var queries = require('../models/queries')

router.use('/', (req, res, next) => {

  console.log(res.cookie)

  var courseID = res.cookie.course_id
  var userID = res.cookie.user_id

  var is_physics = Boolean(courseID == 38083);

  if (courseID == 10184) {
    courseID = 38082;
  }

  if (auth.provider.admin) {
    if (req.query.masquerade) {
      queries.homepageQuery(parseInt(req.query.masquerade),
        courseID,
        (
          module_progress,
          score,
          awarded_badge_ids,
          leaderboard,
          my_team,
          home_updates,
          home_vids,
          home_links,
          daily_yalie
        ) => {
          res.render('home', {
            title: 'Home | ONEXYS',
            courseID,
            module_progress,
            score,
            awarded_badge_ids,
            leaderboard,
            my_team,
            home_updates,
            home_vids,
            home_links,
            daily_yalie,
            is_physics,
            admin: auth.provider.admin,
            masquerade: true,
          });
        });
    } else {
      queries.homepageAdminQuery(
        courseID,
        (
          module_progress,
          leaderboard,
          home_updates,
          home_vids,
          home_links,
          students,
          daily_yalie
        ) => {
          res.render('home', {
            title: 'Home | ONEXYS',
            courseID,
            module_progress,
            score: 0,
            awarded_badge_ids: [],
            leaderboard,
            my_team: {
              Name: "Admin",
              Score: 0
            },
            home_updates,
            home_vids,
            home_links,
            daily_yalie,
            is_physics,
            admin: auth.provider.admin,
            masquerade: false,
            students
          });
        });
    }
  }

  else {
    queries.homepageQuery(
      userID,
      courseID,
      (
        module_progress,
        score,
        awarded_badge_ids,
        leaderboard,
        my_team,
        home_updates,
        home_vids,
        home_links,
        daily_yalie
      ) => {
        res.render('home', {
          title: 'Home | ONEXYS',
          courseID,
          module_progress,
          score,
          awarded_badge_ids,
          leaderboard,
          my_team,
          home_updates,
          home_vids,
          home_links,
          daily_yalie,
          is_physics,
          admin: auth.provider.admin
        });
      });
  }
});

module.exports = router;
