
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
var modules = require('./routes/modules');
var badges = require('./routes/badges');
var admin = require('./routes/admin');
var api = require('./routes/api');
var app = express();

var launch = require('./routes/canvasLaunch');

var redis = require('redis').createClient(config.redisURL);

var app = require('../app'),
debug = require('debug')('onexys-jade:server'),
http = require('http'),
assert = require('assert'),
mongo = require('../models/mongo.js'),
config = require('./config.js');












redis.on('ready', success => {
    console.log("Redis is ready");
});

redis.on('error', err => {
    console.log("Redis error:", err);
});



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
app.use('/api', api);

//app.use('/home',[auth.updateCookies,auth.checkUser,canvas.awardLuckies],home)
app.use('/badges',[auth.updateCookies, auth.checkUser, canvas.awardLuckies],badges)
// Admins don't need to earn luckies, so no canvas.awardLuckies
app.use('/admin',[auth.updateCookies, auth.checkAdmin],admin)

app.use('/modules',[auth.updateCookies],modules)
app.use('/launch',launch)

app.use('/',[auth.updateCookies, auth.checkUser], index);


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
    res.sendFile(path.join(__dirname, "/views/static/error/404.html"));
});


#!/usr/bin/env node

/**
 * Module dependencies.
 */


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

mongo.client.connect(err => {
    assert(!err);
    console.log("Mongo is ready");
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);
    // named pipe
    if(isNaN(port)) { return val; }
    // port number
    if(port >= 0) { return port; }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') throw error;
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}




require('./bin/www');
