var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('launch', { title: 'Canvas Launch', body : 'Launch Test' });
});

router.post('/', function(req, res, next) {
  if (req.body.oauth_consumer_key) {

    var consumer_key_valid = 'qwertyuiop' 
    var consumer_key_req = req.body.oauth_consumer_key;

    if (consumer_key_valid === consumer_key_req) {
      var moduleName = req.body.custom_canvas_assignment_title;
      if (moduleName) {
        var moduleID = linkRel[moduleName];
        res.redirect('/modules/' + moduleID);
      } else {
        res.send('moduleID or moduleName invalid or other issue.')
      }
    }
  }
});

module.exports = router;

var linkRel = {
    '(Linear) Functions (Blue)' : 1,
    'Functions and Fitting Data (Blue)' : 2,
    'Function Transformations (Blue)' : 3,
    'Quadratic Functions (Blue)' : 4,
    'Exponential Functions (Blue)' : 5,
    'Compound Interest and the Number e (Blue)' : 6,
    'Logarithmic Functions (Blue)' : 7,
    'Geometry and Periodic Motion (Blue)' : 8,
    'Measuring Angles with Arclength (Blue)' : 9,
    'Movie Physics (Blue)' : 10,
}
