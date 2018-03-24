var config = require('./config');
var client = require('redis').createClient(config.redisURL);  
module.exports = {
    client,
}