var express = require("express");
var router = express.Router();
var config = require("../bin/config");
var queries = require("../models/queries");

router.use("/", (req, res, next) => {
  console.log(req.session);

  var courseID = parseInt(req.session.course_id);
  var userID = parseInt(req.session.user_id);

  console.log("Course and User IDs");

  console.log(courseID);
  console.log(userID);

  if (courseID == 10184) {
    courseID = 38082;
  }

  var is_physics = Boolean(courseID == 38083);

  if (req.session.admin) {
    if (req.query.masquerade) {
      queries.homepageQueryMasquerade(
        parseInt(req.query.masquerade),
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
          console.log("Masquerade branch, " + home_links)
          res.render("home", {
            title: "Home | ONEXYS",
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
            admin: req.session.admin,
            masquerade: true
          });
        }
      );
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
          console.log("Admin branch, " + home_links)
          res.render("home", {
            title: "Home | ONEXYS",
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
        res.render("home", {
          title: "Home | ONEXYS",
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
          admin: req.session.admin
        });
      }
    );
  }
});

module.exports = router;
