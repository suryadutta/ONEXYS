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

var mongo = require('./models/mongo');
var config = require('./bin/config');
var auth = require('./bin/auth');

var index = require('./routes/index');
var home = require('./routes/home');
var modules = require('./routes/modules');
var badges = require('./routes/badges');
var admin = require('./routes/admin');
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

app.use(cookieParser(config.client_secret));

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

app.get('/',index);
app.use('/home',[auth.updateCookies,auth.checkUser],home)
app.use('/badges',[auth.updateCookies,auth.checkUser],badges)
app.use('/admin',[auth.updateCookies,auth.checkAdmin],admin)

app.use('/modules',auth.updateCookies,modules)

app.use('/launch',launch)

// static file display
app.get("/coach-information", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "coach_information", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.post("/coach-information", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "coach_information", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.get("/welcome", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "welcome_page", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.post("/welcome", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "welcome_page", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.get("/life-on-grounds", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "life_on_grounds", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.post("/life-on-grounds", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "life_on_grounds", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.get("/post-test", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "post_test", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.post("/post-test", function(req, res) {
  mongo.getStaticPage(req.session.course_id, "post_test", function(err, page) {
    res.sendFile(path.join(__dirname, "/views/static/"+page));
  });
});

app.get("/missing-resource", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/404.html"));
});

app.post("/missing-resource", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/404.html"));
});

app.get("/not-open", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/not-open.html"));
});

app.post("/not-open", function(req, res) {
  res.sendFile(path.join(__dirname, "/views/static/not-open.html"));
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

  res.sendFile(path.join(__dirname, "/views/static/404.html"));
});

module.exports = app;
