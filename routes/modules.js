var express = require("express");
var router = express.Router();
var mongo = require("../models/mongo");
var config = require("../bin/config");
var asyncStuff = require("async");

/* GET module page. */

router.get("/:id", function(req, res, next) {
  console.log("Viewing Module " + req.params.id);

  mongo.getModule(req.session.course_id, req.params.id, function(err, moduleData) {
    console.log("Viewing Module moduleData", moduleData);

    res.render("module", {
      data: moduleData,
      course_number: req.session.course_id || "38082",
      canvas_url: config.canvasURL
    });
  });
});

module.exports = router;
