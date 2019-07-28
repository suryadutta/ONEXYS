var express = require('express');
var router = express.Router();
var assert = require('assert');

// AJAX uses this route to dynamically apply video reordering support
router.get('/updateVideo', (req, res) => {
    try {
        console.log(req.session);
        //assert.notEqual(req.session.user, null);
        mongo.updateData(req.session.course_id, "home", { _id: req.params.id }, {position: parseInt(req.params.position)}, (err, result) => {
            if(err) {
                res.status(500);
                res.send("Encountered error saving video info.");
            } else {
                res.status(200);
                res.send("200 - OK");
            }
        });
    } catch(e) {
        res.status(406);
        res.send("406 - Not acceptable. You must provide querystring arguments 'id' and 'position', the latter of which should be an integer value.");
    }
});

/* GET home page. */
router.use('/', function(req, res, next) {
  res.render('index', { title: 'ONEXYS' });
});

module.exports = router;
