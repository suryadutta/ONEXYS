var express = require('express');
var router = express.Router();
var assert = require('assert');

// AJAX uses this route to dynamically apply video reordering support
router.use('updateVideo', (req, res) => {
    try {
        console.log(req.session);
        //assert.notEqual(req.session.user, null);
        assert.equals(req.method, 'GET');
        mongo.updateData(req.session.course_id, "home", { _id: req.params.id }, parseInt(req.params.position), (err, result) => {
            if(err) {
                res.status()
            } else {
                res.status(200);
                res.send("200 - OK");
            }
        });
    } catch(e) {
        res.status(400);
        res.send("400 - Bad Request. The given method, syntax, or protocol is not currently supported.");
    }
});

/* GET home page. */
router.use('/', function(req, res, next) {
  res.render('index', { title: 'ONEXYS' });
});

module.exports = router;
