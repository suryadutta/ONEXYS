var express = require('express'),
    router = express.Router(),
    config = require("../bin/config"),
    queries = require("../models/queries"),
    auth = require("../bin/auth.js");

router.post("/home", [auth.updateCookies, auth.checkUser], (req, res) => {
    console.log("POST to /home");
    res.redirect("/home");
});

router.get("/home", (req, res) => {
    console.log("GET on /home");
    // Assume not lucky for now
    res.render("home", {
        // These will remain here
        title: "Home",
        lucky: false,
        admin: false,
        masquerade: false,
        students: [],
        heroku_app: config.herokuAppName,
        courseID: req.session.courseID,
        canvasURL: config.canvasURL,
        // Everything else goes into AJAX
        my_team: {Name: "Developers", Score: "420"},
        awarded_badges: [],
        post_test_status: {
            open: false,
            locked: false,
            tooltip: "Post test tooltip"
        },
    });
});

router.use("/coach-information", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "coach_information", function(err, page) {
    res.sendFile("../views/static/coach-info/" + page);
  });
});
router.use("/welcome", function(req, res) {
    mongo.getStaticPage(req.session.course_id, "welcome_page", function(err, page) {
        res.sendFile("../views/static/welcome/" + page);
    });
});
router.use("/life-on-grounds", function(req, res) {
    mongo.getStaticPage(req.session.course_id, "life_on_grounds", function(err, page) {
        res.sendFile("../views/static/life-on-campus/" + page);
    });
});
router.use("/post-test", function(req, res) {
    mongo.getStaticPage(req.session.course_id, "post_test", function(err, page) {
        res.sendFile("../views/static/post-test/" + page);
    });
});
router.use("/missing-resource", function(req, res) {
    res.send("Resource is missing!");
});
router.use("/not-open", function(req, res) {
    res.send("Assignment is not open!");
});

// Serve index page
router.use('/', function(req, res, next) {
    res.render('index', { title: 'System Index' });
});

module.exports = router;
