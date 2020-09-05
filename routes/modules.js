var express = require("express");
var router = express.Router();
var mongo = require("../models/mongo");
var config = require("../bin/config");
var asyncStuff = require("async");

/* GET module page. */

router.get("/:id", function(req, res, next) {
  mongo.getModule(req.session.course_id, req.params.id, function(err, moduleData) {
    res.render("module", {
      data: moduleData,
      course_number: req.session.course_id || "38082",
      canvas_url: config.canvasURL,
      heroku_app: config.herokuAppName,
      lucky: req.session.lucky
    });
  });
});

module.exports = router;
