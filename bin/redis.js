var config = require('./config');
var client = require('redis').createClient(config.redisURL);

client.on('ready', success => {
    console.log("Redis is ready");
});

client.on('error', err => {
    console.log("Redis error:", err);
});

module.exports = {
    client,
}
