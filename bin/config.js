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
config.mongoURL = 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@onexys-shard-00-00-qkreu.mongodb.net:27017,onexys-shard-00-01-qkreu.mongodb.net:27017,onexys-shard-00-02-qkreu.mongodb.net:27017/uva-onexys?ssl=true&replicaSet=ONEXYS-shard-0&authSource=admin&retryWrites=true';

//add to list if we create new courses
//format is courseID: databaseName
config.mongoDBs = {
  '2517': 'uva-onexys',
}

//the name of the mongo db to connect to
config.mongo_db_name = process.env.MONGO_DB_NAME

config.cookieduration = 1000 * 60 * 60 * 24;

module.exports = config;
