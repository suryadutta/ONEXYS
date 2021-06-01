const router = require("express").Router(),
  mongo = require("../models/mongo"),
  canvas = require("../models/canvas"),
  config = require("../bin/config"),
  auth = require("../bin/auth"),
  assert = require("assert");

function requireAdmin(req, res, next) {
  if (req.session.admin) next();
  else res.redirect("/home");
}

router.get("/homepageEdit", (req, res) => {
  res.render("admin/homepageEdit", {
    title: `Edit Course Homepage`,
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/navigation", (req, res) => {
  res.render("admin/navigation", {
    title: `Edit Navigation Links`,
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/modules", (req, res) => {
  res.render("admin/modules", {
    title: `Course Modules`,
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/homeVidEdit/:id", (req, res) => {
  res.render("admin/homeVidEdit", {
    title: `Editing video ${req.params.id}`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/modules/edit/:id", (req, res) => {
  res.render("admin/moduleEdit", {
    title: `Editing module ${req.params.id}`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/modules/videoEdit/:moduleID/:videoID", (req, res) => {
  res.render("admin/moduleVideoEdit", {
    title: `Editing video ${req.params.id}`,
    heroku: config.herokuAppName,
    moduleID: req.params.moduleID,
    videoID: req.params.videoID,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/badges", (req, res) => {
  res.render("admin/badges", {
    title: `Course Badges`,
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/badges/edit/:id", (req, res) => {
  res.render("admin/badgeEdit", {
    title: `Editing badge ${req.params.id}`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/dailyTasks", (req, res) => {
  res.render("admin/dailies", {
    title: "Daily Tasks",
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/dailyTasks/edit/:id", (req, res) => {
  res.render("admin/dailyEdit", {
    title: `Editing daily ${req.params.id}`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/luckyBonuses", (req, res) => {
  res.render("admin/lucky", {
    title: "Lucky Bonuses",
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/unifiedGradebook", (req, res) => {
  res.render("admin/gradebook", {
    title: "Gradebook",
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.post("/", (req, res) => {
  res.redirect("/admin");
});

router.get("/", (req, res) => {
  res.render("admin/index", { courseID: Object.keys(req.session.course_id)[0] });
});

module.exports = {
  router,
  requireAdmin,
};
