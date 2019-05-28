var express = require("express");
var router = express.Router();
var config = require("../bin/config");
var queries = require("../models/queries");

router.use("/", (req, res, next) => {
  console.log(req.session);
  console.log("Course title: " + req.session.course_title);

  var courseID = parseInt(req.session.course_id);
  var userID = parseInt(req.session.user_id);

  if (courseID == 10184) {
    courseID = 38082;
  }

  var is_physics = Boolean(courseID == 38083);

  if (req.session.admin) {
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
            title: "Home | CONEX",
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
            admin: req.session.admin,
            masquerade: true
          });
        }
      );
    } else {
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
          console.log("BEGIN HOMEPAGE ADMIN QUERY");
          console.log("courseID: " + courseID);
          console.log("module_progress: " + module_progress);
          console.log("leaderboard: " + leaderboard);
          console.log("home_updates: " + home_updates);
          console.log("home_vids: " + home_vids);
          console.log("home_links: " + home_links);
          console.log("daily_yalie: " + daily_yalie);
          console.log("is_physics: " + is_physics);
          console.log("students: " + students);
          res.render("home", {
            title: "Home | CONEX",
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
            admin: req.session.admin,
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
          title: "Home | CONEX",
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
          admin: req.session.admin
        });
      }
    );
  }
});

module.exports = router;
