var config = {};

if(!process.env.NODE_ENV) {
    require('dotenv').config(); // If we have no node env, load env config
    console.log("Running in " + process.env.NODE_ENV + " mode.");
}

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

config.disableLeaderboard = process.env.DISABLE_LEADERBOARD.toLowerCase() == 'false' ? true : false || false;

//configure MongoDB urls here - course ID to mongoDB URL
config.mongoURL = 'mongodb://'+config.mongo_username+':'+config.mongo_password+'@conexcluster-shard-00-00-bgeoe.mongodb.net:27017,conexcluster-shard-00-01-bgeoe.mongodb.net:27017,conexcluster-shard-00-02-bgeoe.mongodb.net:27017/test?ssl=true&replicaSet=ConexCluster-shard-0&authSource=admin&retryWrites=true';

//add to list if we create new courses
//format is courseID: databaseName
config.mongoDBs = {
  '2517': 'blue',
  '3528': 'orange',
  '3529': 'white',
  '3559': 'conexDemo',
  '4887': 'conexBlue20',
  '4888': 'conexDemo20',
  '5710': 'smithDemo20',
  '5713': 'trinity20',
  '5772': 'conexWhite20',
  '5773': 'conexOrange20',
  '48080': 'smith',
  '48036': 'yale-blue',
  '48037': 'yale-gray',
  '48039': 'yale-physics',
  '48038': 'yale-white',
};

//the name of the mongo db to connect to
config.mongo_db_name = process.env.MONGO_DB_NAME;

config.cookieduration = 1000 * 60 * 60 * 24;

config.herokuAppName = process.env.HEROKU_APP_NAME;
config.testApp = process.env.TEST_SERVER;

module.exports = config;
