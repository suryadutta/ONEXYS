var express = require("express"),
  router = express.Router(),
  config = require("../bin/config"),
  queries = require("../models/queries"),
  auth = require("../bin/auth.js"),
  mongo = require("../models/mongo"),
  path = require("path");

router.post("/home", [auth.updateCookies, auth.checkUser], (req, res) => {
  res.redirect("/home");
});

router.get("/home", (req, res) => {
  // Assume not lucky for now
  res.render("home", {
    title: "Home",
    lucky: false,
    admin: req.session.admin,
    masquerade: false,
    students: [],
    heroku_app: config.herokuAppName,
  });
});

router.post("/badges", [auth.updateCookies, auth.checkUser], (req, res) => {
  res.redirect("/badges");
});

router.get("/badges", (req, res) => {
  res.render("badges", {
    title: "Badges",
    admin: req.session.admin,
    masquerade: false,
    students: [],
    heroku_app: config.herokuAppName,
  });
});

router.use("/coach-information", function (req, res) {
  try {
    mongo.getNavigationData(req.session.course_id, (err, data) => {
      if (err)
        res
          .status(500)
          .send(
            "500 - Internal Server Error. Coach information page could not be retrieved."
          );
      else
        res.sendFile(path.resolve("./views/static/coach-info/" + data[0].page)); // see navigation collection
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.use("/welcome", function (req, res) {
  try {
    mongo.getNavigationData(req.session.course_id, (err, data) => {
      if (err)
        res
          .status(500)
          .send(
            "500 - Internal Server Error. Coach information page could not be retrieved."
          );
      else res.sendFile(path.resolve("./views/static/welcome/" + data[0].page));
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.use("/life-on-grounds", function (req, res) {
  try {
    mongo.getNavigationData(req.session.course_id, (err, data) => {
      if (err)
        res
          .status(500)
          .send(
            "500 - Internal Server Error. Coach information page could not be retrieved."
          );
      else
        res.sendFile(
          path.resolve("./views/static/life-on-grounds/" + data[0].page)
        );
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.use("/post-test", function (req, res) {
  try {
    mongo.getNavigationData(req.session.course_id, (err, data) => {
      if (err)
        res
          .status(500)
          .send(
            "500 - Internal Server Error. Coach information page could not be retrieved."
          );
      else
        res.sendFile(path.resolve("./views/static/post-test/" + data[0].page));
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.use("/missing-resource", function (req, res) {
  res.send("Resource is missing!");
});

router.use("/not-open", function (req, res) {
  res.send("Assignment is not open!");
});

// Serve index page
router.use("/", function (req, res, next) {
  res.render("index", { title: "System Index" });
});

module.exports = router;
