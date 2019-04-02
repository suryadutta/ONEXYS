var config = {};

config.port = process.env.PORT || '3000';
config.host = process.env.HOST || 'localhost';

config.canvasURL = process.env.CANVAS_URL;
config.client_id = process.env.CANVAS_KEY;
config.client_secret = process.env.DEVELOPER_TOKEN;
config.redirectURL = process.env.REDIRECT_URL;

config.canvasAdminAuthToken= process.env.CANVAS_ADMIN_AUTH_TOKEN;
config.canvasPageResults = process.env.CANVAS_PAGE_RESULTS || "200";

config.redisURL = process.env.REDIS_URL || '';

config.mongo_username = process.env.MONGO_USERNAME || 'localhost',
config.mongo_password = process.env.MONGO_PASSWORD || '',
config.local_mongo_database = 'mongodb://localhost:27017/oneyxs_dev'

config.disableLeaderboard = process.env.DISABLE_LEADERBOARD.toLowerCase() == 'true' ? true : false || false;

//configure MongoDB urls here - course ID to mongoDB URL
config.mongoURLs = {
    '2517' : 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@onexys-shard-00-02-qkreu.mongodb.net:27017/uva-onexys' || config.local_mongo_database,
    '38082': 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@ds121189.mlab.com:21189/onexys_blue' || config.local_mongo_database,
    '10184': 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@ds223509.mlab.com:23509/onexys_dev' || config.local_mongo_database,
    '38080': 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@ds121189.mlab.com:21189/onexys_gray' || config.local_mongo_database,
    '38083': 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@ds015924.mlab.com:15924/onexys_physics' || config.local_mongo_database,
    '38081': 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@ds157614.mlab.com:57614/onexys_white' || config.local_mongo_database
}

config.cookieduration = 1000 * 60 * 60 * 24;

module.exports = config;
