const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const auth = require('../bin/auth')
const queries = require('../models/queries')

router.use('/', (req, res, next) => {

  const courseID = auth.provider.body.custom_canvas_course_id;
  const userID = auth.provider.body.custom_canvas_user_id;

  if (courseID == 10184) {
    courseID = 38082;
  }

  console.log('User ID: ', userID, '  Course ID: ', courseID);

  console.log(auth.provider.body);

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
          admin: auth.provider.admin
        });
      });
  }
});

module.exports = router;
