var express = require('express'),
    router = express.Router(),
    config = require("../bin/config"),
    queries = require("../models/queries");


router.use("/coach-information", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "coach_information", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/coach-info/"+page));
  });
});

router.use("/welcome", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "welcome_page", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/welcome/"+page));
  });
});

router.use("/life-on-grounds", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "life_on_grounds", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/life-on-campus/"+page));
  });
});

router.use("/post-test", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "post_test", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/post-test/"+page));
  });
});

router.use("/missing-resource", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/error/404.html"));
});

router.use("/not-open", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/error/not-open.html"));
});

// Serve index page
router.use('/', function(req, res, next) {
    res.render('index', { title: 'System Index' });
});

module.exports = router;
