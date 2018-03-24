var express = require('express');
var router = express.Router();
var mongo = require('../models/mongo')
var config = require('../bin/config')
var auth = require('../bin/auth')
var asyncStuff = require('async');

/* GET module page. */

router.get('/:id', function(req, res, next) {
    mongo.getModule(req.params.id,function(err,moduleData){
        res.render('module', {
            data: moduleData,
            course_number: auth.provider.body.custom_canvas_course_id || '38082',
            canvas_url: config.canvasURL,
        });
        
    });
});

module.exports = router;
