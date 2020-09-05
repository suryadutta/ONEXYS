var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/', function(req, res, next) {
  res.render('index', { title: 'System Index' });
});

module.exports = router;
