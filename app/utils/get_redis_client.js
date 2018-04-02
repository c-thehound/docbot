// returns the correct redis instance according to dev environment
const redis = require('redis');
const config = require('../../config')();
if (config.AUTH) {
    // means this is a production server
    let redis_client = redis.createClient(config.REDIS_PORT, config.REDIS_HOST_NAME);
    redis_client.auth(config.AUTH.split(":")[1]);
    module.exports = redis_client;
} else {
    module.exports = redis.createClient(config.REDIS_PORT);
}