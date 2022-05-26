const router = require("express").Router(),
  config = require("../bin/config"),
  canvas = require("../models/canvas"),
  mongo = require("../models/mongo");

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

router.get("/homeVidAdd", (req, res) => {
  res.render("admin/homeVidAdd", {
    title: `Adding Video`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/modules/add/:id", (req, res) => {
  res.render("admin/moduleAdd", {
    title: `Adding Module`,
    heroku: config.herokuAppName,
    id: req.params.id,
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

router.get("/luckyEdit/:id", (req, res) => {
  res.render("admin/luckyEdit", {
    title: `Editing lucky ${req.params.id}`,
    heroku: config.herokuAppName,
    id: req.params.id,
    courseID: Object.keys(req.session.course_id)[0],
  });
});

router.get("/luckyAdd/:id", (req, res) => {
  res.render("admin/luckyAdd", {
    title: `Adding Lucky`,
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

router.get("/modules/videoAdd/:moduleID", (req, res) => {
  res.render("admin/moduleVideoAdd", {
    title: `Adding video to module ${req.params.moduleID}`,
    heroku: config.herokuAppName,
    moduleID: req.params.moduleID,
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

router.get("/unifiedGradebook", async (req, res) => {
  const courseID = Object.keys(req.session.course_id)[0],
    modules = await mongo.client
      .db(config.mongoDBs[courseID])
      .collection("modules")
      .find()
      .sort({ _id: 1 })
      .toArray();

  const moduleTitles = modules.map((module) => ({
    id: module._id,
    title: module.primary_title + " " + module.secondary_title,
  }));

  res.render("admin/gradebook", {
    title: "Gradebook",
    heroku: config.herokuAppName,
    courseID: Object.keys(req.session.course_id)[0],
    moduleTitles,
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
