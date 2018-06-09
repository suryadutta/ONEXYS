var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/', function(req, res, next) {
  console.log("_______Hi!routes/index.js_______");
  res.render('index', { title: 'ONEXYS' });
});

module.exports = router;
