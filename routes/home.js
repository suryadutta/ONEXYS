var express = require("express");
var router = express.Router();
var config = require("../bin/config");
var queries = require("../models/queries");

router.use("/", (req, res, next) => {
  //console.log("Request session: " + req.session);
  //console.log("Course title: " + req.session.course_title);

  console.log("Made it to home!?");
  console.log(req.session.admin);

  var courseID = parseInt(req.session.course_id);
  var userID = parseInt(req.session.user_id);

  //if (courseID == 10184) {
    //courseID = 38082;
  //}

  var is_physics = Boolean(courseID == 48039);
  //var is_physics = false;

  if (req.session.admin) {
    console.log("Is admin");
    if (req.query.masquerade) {
      queries.homepageQueryMasquerade(
        parseInt(req.query.masquerade),
        courseID,
        req.session.course_title,
        (
          module_progress,
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
            heroku_app: config.herokuAppName
          });
        }
      );
    } else {
      console.log("Not masquerade");
      queries.homepageAdminQuery(
        courseID,
        req.session.course_title,
        (
          module_progress,
          leaderboard,
          home_updates,
          home_vids,
          home_links,
          students,
          daily_yalie
        ) => {
          console.log(courseID);
          console.log(module_progress);
          console.log(leaderboard);
          console.log(home_updates);
          console.log(home_vids);
          console.log(home_links);
          console.log(daily_yalie);
          console.log(students);
          res.render("home", {
            title: "Home | " + config.herokuAppName,
            courseID,
            module_progress,
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
            students
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
          heroku_app: config.herokuAppName
        });
      }
    );
  }
});

module.exports = router;
