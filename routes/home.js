var express = require("express");
var router = express.Router();
var config = require("../bin/config");
var queries = require("../models/queries");

router.use("/", (req, res, next) => {
  //console.log("Request session: " + req.session);
  //console.log("Course title: " + req.session.course_title);

  var courseID = parseInt(req.session.course_id);
  var userID = parseInt(req.session.user_id);

  //if (courseID == 10184) {
    //courseID = 38082;
  //}

  var is_physics = Boolean(courseID == 48039);
  //var is_physics = false;

  if (req.session.admin) {
    if (req.query.masquerade) {
      queries.homepageQueryMasquerade(
        parseInt(req.query.masquerade),
        courseID,
        req.session.course_title,
        (
          module_progress,
          post_test_status,
          score,
          awarded_badges,
          leaderboard,
          my_team,
          home_updates,
          home_vids,
          home_links,
          daily_yalie
        ) => {
          res.render("home", {
            title: "Home | " + config.herokuAppName,
            courseID,
            module_progress,
            post_test_status,
            score,
            awarded_badges,
            leaderboard,
            my_team,
            home_updates,
            home_vids,
            home_links,
            daily_yalie,
            is_physics,
            canvasURL: config.canvasURL,
            admin: req.session.admin,
            masquerade: true,
            heroku_app: config.herokuAppName,
            lucky: req.session.lucky
          });
        }
      );
    } else {
      queries.homepageAdminQuery(
        courseID,
        req.session.course_title,
        (
          module_progress,
          post_test_status,
          leaderboard,
          home_updates,
          home_vids,
          home_links,
          students,
          daily_yalie
        ) => {
          console.log("Post Test Status")
          console.log(post_test_status)
          res.render("home", {
            title: "Home | " + config.herokuAppName,
            courseID,
            module_progress,
            post_test_status,
            score: 0,
            awarded_badges: [],
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
            canvasURL: config.canvasURL,
            admin: req.session.admin,
            heroku_app: config.herokuAppName,
            masquerade: false,
            students,
            lucky: req.session.lucky
          });
        }
      );
    }
  } else {
    queries.homepageQuery(
      userID,
      courseID,
      req.session.course_title,
      (
        module_progress,
        post_test_status,
        score,
        awarded_badges,
        leaderboard,
        my_team,
        home_updates,
        home_vids,
        home_links,
        daily_yalie
      ) => {
        if (req.session.lucky){
          console.log("Hackfix!");
          score += parseInt(req.session.lucky.point_value);
        }
        res.render("home", {
          title: "Home | " + config.herokuAppName,
          courseID,
          module_progress,
          post_test_status,
          score,
          awarded_badges,
          leaderboard,
          my_team,
          home_updates,
          home_vids,
          home_links,
          daily_yalie,
          is_physics,
          canvasURL: config.canvasURL,
          admin: req.session.admin,
          heroku_app: config.herokuAppName,
          lucky: req.session.lucky
        });
      }
    );
  }
});

module.exports = router;
