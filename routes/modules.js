var express = require("express"),
    router = express.Router(),
    mongo = require("../models/mongo"),
    config = require("../bin/config"),
    assert = require("assert");

/* GET module page. */
router.get("/:id", (req, res, next) => {
    try {
        // Validate inputs
        assert(/\d+/.test(req.session.course_id));
        assert(/\d+/.test(req.params.id));
        mongo.getModule(req.session.course_id, req.params.id, (err, module) => {
            if(module) {
                res.render("module", {
                    data: moduleData,
                    course_number: req.session.course_id || "38082",
                    canvas_url: config.canvasURL,
                    heroku_app: config.herokuAppName,
                    lucky: req.session.lucky
                });
            } else res.status(406).send("Module doesn't exist");
        });
    } catch(e) {
        res.status(406).send("Bad input");
        //res.render("errors/inputError");
    }
});

module.exports = router;
