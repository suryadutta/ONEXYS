if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

var express = require('express'),
    config = require('./bin/config'),
    redis = require('redis').createClient(config.redisURL),
    cookieParser = require('cookie-parser'),
    modules = require('./routes/modules'),
    session = require('client-sessions'),
    canvas = require('./models/canvas'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    admin = require('./routes/admin'),
    mongo = require('./models/mongo'),
    api = require('./routes/api'),
    auth = require('./bin/auth'),
    assert = require('assert'),
    http = require('http');
    app = express();


app.set('port', process.env.PORT || '3000');
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
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

app.use('/api', api);
app.use('/admin', [auth.updateCookies, auth.checkUser, admin.requireAdmin], admin.router);
app.use('/modules', modules);
app.get('/callback', auth.oath2_callback);
app.use('/', index);

redis.on('ready', success => {
    console.log("Redis is ready");
});

redis.on('error', err => {
    console.log("Redis error:", err);
});

var server = http.createServer(app);
mongo.client.connect(err => {
    assert(!err);
    console.log("Mongo is ready");
    server.listen(process.env.PORT || '3000');
});
