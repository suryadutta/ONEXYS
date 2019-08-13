const router = require("express").Router(),
      mongo = require("../models/mongo"),
      canvas = require("../models/canvas"),
      config = require('../bin/config'),
      assert = require('assert');

router.get("/site-info", (req, res) => {
    try {
        assert(req.query.hostname); // Verify hostname exists
        assert(/^\d+$/.test(req.query.course)); // Verify course number exists and is valid
        mongo.getCourseInfo({hostname: req.query.hostname, course: req.query.course}, (err, data) => {
            if(err) res.status(500).send("Encountered a database error. Information could not be retrieved.");
            else res.status(200).header("Access-Control-Allow-Origin", "https://" + req.query.hostname).send(data);
        });
    } catch(e) { console.log(e); res.status(500).send("API request could not be processed."); }
});



module.exports = router;
