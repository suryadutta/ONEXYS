if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var express = require('express');
var path = require('path');
var config = require('./bin/config');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session')
var cookieSession = require('cookie-session')

var config = require('./bin/config');
var auth = require('./bin/auth')
var request = require('request');

var index = require('./routes/index');
var home = require('./routes/home');
var modules = require('./routes/modules');
var badges = require('./routes/badges');
var admin = require('./routes/admin')
var app = express();

var launch = require('./routes/canvasLaunch')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy')

app.use(cookieSession({
  name: 'onexys_session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  overwrite: true,
}))

app.get('/callback',auth.oath2_callback);

app.get('/',index);
app.use('/home',[auth.updateProvider,auth.checkUser],home)
app.use('/badges',[auth.updateProvider,auth.checkUser],badges)
app.use('/admin',[auth.updateProvider,auth.checkAdmin],admin)

app.use('/modules', modules)

app.use('/launch',launch)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
