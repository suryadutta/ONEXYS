const router = require("express").Router(),
      mongo = require("../models/mongo"),
      canvas = require("../models/canvas"),
      config = require('../bin/config'),
      assert = require('assert');

// Access static information about the given site (track)
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

// AJAX uses this route to dynamically apply video reordering support
router.post('/admin/updateVideo', (req, res) => {
    if(req.session.admin) {
        try {
            assert(/[A-Z\d]{16}/.test(req.body.id)); // IDs must be a 16 character alphanumeric string
            assert(/\d+/.test(req.body.position)); // Positions consist at least 1 digit, and nothing else
            if(req.session.admin) { // If the user is an admin, fulfill the req
                mongo.updateData(req.session.course_id, "home", { type: "video", _id: req.body.id }, { position: parseInt(req.body.position) }, (err, result) => {
                    if(err) {
                        res.status(500);
                        res.send("500 - Internal Server Error. Encountered error saving video info.");
                    } else {
                        res.status(200);
                        res.send("200 - OK");
                    }
                });
            } else { // If the user is not an admin, terminate the req with status 401
                res.status(401);
                res.send("401 - Unauthorized. In order to change videos, you must be a system administrator.");
            }
        } catch(e) {
            res.status(406);
            res.send("406 - Not acceptable. You must provide querystring arguments 'id' (a 16 character alphanumberic string) and 'position' (an integer / string consisting of at least 1 digit and nothing else).");
        }
    } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// AJAX uses this route to dynamically open/close and mark modules as due
router.post('/admin/updateModule', (req, res) => {
    if(req.session.admin) {
        try {
            assert(/\d+/.test(req.body.id)); // IDs must be an integer

            var updates = {};
            if(req.body.open) {
                assert(/(true|false)/.test(req.body.open)); // Open must be a valid boolean
                updates.open = req.body.open;
            }
            if(req.body.due) {
                assert(/(true|false)/.test(req.body.due)); // Due must be a valid boolean
                updates.due = req.body.due;
            }

            if(req.session.admin) {
                mongo.updateData(req.session.course_id, "modules", { _id: parseInt(req.body.id) }, updates, (err, data) => {
                    if(err) {
                        res.status(500);
                        res.send("500 - Internal Server Error. Encountered error saving module info.");
                    } else {
                        res.status(200);
                        res.send("200 - OK");
                    }
                });
            } else {
                res.status(401);
                res.send("401 - Unauthorized. In order to change modules, you must be a system administrator.");
            }
        } catch(e) {
            res.status(406);
            res.send("406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and 'open' and/or 'due' (booleans).")
        }
    } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

//



module.exports = router;
