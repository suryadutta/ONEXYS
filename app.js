if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var express = require('express');
var path = require('path');
var config = require('./bin/config');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('client-sessions');

var canvas = require('./models/canvas');
var mongo = require('./models/mongo');
var config = require('./bin/config');
var auth = require('./bin/auth');

var index = require('./routes/index');
var home = require('./routes/home');
var modules = require('./routes/modules');
var badges = require('./routes/badges');
var admin = require('./routes/admin');
var api = require('./routes/api');
var app = express();

var launch = require('./routes/canvasLaunch');

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

app.set('trust proxy', true);

app.use(cookieParser(config.client_secret, { sameSite: 'none' }));

app.use(session({
  cookieName: 'session',
  secret: config.client_secret,
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5,
  cookie: {
    path: '/',
    ephemeral: false,
    httpOnly: true,
    secure: false
  }
}));

app.get('/callback',auth.oath2_callback);
app.use('/api', api);

app.get('/',index);
app.use('/home',[auth.updateCookies,auth.checkUser,canvas.awardLuckies],home)
app.use('/badges',[auth.updateCookies,auth.checkUser,canvas.awardLuckies],badges)
// Admins don't need to earn luckies, so no canvas.awardLuckies
app.use('/admin',[auth.updateCookies,auth.checkAdmin],admin)

app.use('/modules',[auth.updateCookies,canvas.awardLuckies],modules)

app.use('/launch',launch)

// static file display
app.use("/coach-information", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "coach_information", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/coach-info/"+page));
  });
});

app.use("/welcome", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "welcome_page", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/welcome/"+page));
  });
});

app.use("/life-on-grounds", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "life_on_grounds", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/life-on-campus/"+page));
  });
});

app.use("/post-test", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "post_test", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/post-test/"+page));
  });
});

app.use("/missing-resource", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/error/404.html"));
});

app.use("/not-open", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/error/not-open.html"));
});

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

  console.log("404 Error:");
  console.log(err.message);

  // render the error page
  res.status(err.status || 500);
  //res.render('error');

  res.sendFile(path.join(__dirname, "/views/static/error/not-open.html"));
});

module.exports = app;
