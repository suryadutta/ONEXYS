const express = require("express"),
  router = express.Router(),
  config = require("../bin/config"),
  auth = require("../bin/auth.js"),
  mongo = require("../models/mongo"),
  path = require("path");

router.post("/home", [auth.updateCookies, auth.checkUser, auth.userExists], (req, res) => {
  res.redirect("/home");
});

router.get("/home", (req, res) => {
  if (req.session.user_id && req.session.course_id)
    res.render("home", {
      title: "Home",
      courseID: Object.keys(req.session.course_id)[0],
      courseName: Object.values(req.session.course_id)[0],
      userID: req.session.user_id,
    });
  else res.status(500).render("cookieError");
});

router.post("/badges", [auth.updateCookies, auth.checkUser, auth.userExists], (req, res) => {
  res.redirect("/badges");
});

router.use("/badges", [auth.updateCookies, auth.checkUser, auth.userExists], (req, res) => {
  if (req.session.user_id && req.session.course_id)
    res.render("badges", {
      title: "Badges",
      courseID: Object.keys(req.session.course_id)[0],
      userID: req.session.user_id,
    });
  else res.status(500).render("cookieError");
});

router.use(
  "/coach-information",
  [auth.updateCookies, auth.checkUser, auth.userExists],
  (req, res) => {
    try {
      mongo.getNavigationData(Object.keys(req.session.course_id)[0], (err, data) => {
        if (err)
          res
            .status(500)
            .send("500 - Internal Server Error. Coach information page could not be retrieved.");
        else res.sendFile(path.resolve("./views/static/coach-info/" + data[0].src)); // see navigation collection
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
);

router.use(
  "/life-on-grounds",
  [auth.updateCookies, auth.checkUser, auth.userExists],
  (req, res) => {
    try {
      mongo.getNavigationData(Object.keys(req.session.course_id)[0], (err, data) => {
        if (err)
          res
            .status(500)
            .send("500 - Internal Server Error. Life on Grounds page could not be retrieved.");
        else res.sendFile(path.resolve("./views/static/life-on-grounds/" + data[1].src));
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
);

router.use(
  "/post-test",
  [auth.updateCookies, auth.checkUser, auth.userExists],
  async (req, res) => {
    try {
      const homepageUpdates = await mongo.getHomepageUpdates(Object.keys(req.session.course_id)[0]);
      if (homepageUpdates)
        res.sendFile(
          path.resolve("./views/static/post-test/" + homepageUpdates.post_test_filename)
        );
      else
        res.status(500).send("500 - Internal Server Error. Post test page could not be retrieved.");
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
);

router.use("/welcome", [auth.updateCookies, auth.checkUser, auth.userExists], (req, res) => {
  try {
    mongo.getNavigationData(Object.keys(req.session.course_id)[0], (err, data) => {
      if (err)
        res.status(500).send("500 - Internal Server Error. Welcome page could not be retrieved.");
      else res.sendFile(path.resolve("./views/static/welcome/" + data[2].src));
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.get("/missing-daily", (req, res) => {
  try {
    mongo.getDailyError(Object.keys(req.session.course_id)[0], (err, data) => {
      if (err)
        res.status(500).send("500 - Internal Server Error. Daily error could not be retrieved.");
      else res.send(data.message);
    });
  } catch (e) {
    console.log(e);
    res.status(406).send("406 - Your request could not be processed.");
  }
});

router.get("/missing-resource", function (req, res) {
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
