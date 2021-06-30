var express = require("express"),
  router = express.Router(),
  mongo = require("../models/mongo"),
  config = require("../bin/config"),
  assert = require("assert");

/* GET module page. */
router.get("/:id", (req, res, next) => {
  try {
    // Validate inputs
    assert(/\d+/.test(Object.keys(req.session.course_id)[0]));
    assert(/\d+/.test(req.params.id));
    mongo.getModule(Object.keys(req.session.course_id)[0], req.params.id, (err, moduleData) => {
      if (module) {
        res.render("module", {
          data: moduleData,
          course_number: Object.keys(req.session.course_id)[0],
          canvas_url: config.canvasURL,
          heroku_app: config.herokuAppName,
          lucky: req.session.lucky,
        });
      } else res.status(500).send("500 - Internal Server Error. Module could not be retrieved.");
    });
  } catch (e) {
    res.status(406).send("406 - Your request could not be processed.");
    //res.render("errors/inputError");
  }
});

module.exports = router;
