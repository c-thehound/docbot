const redis_client = require('../utils/get_redis_client');
/**
 * Get saved details from redis cache
 * @param {string} user_id unique user identifier
 */
const get_data = (user_id) => {
    console.info('[redis] get data');
    return new Promise((good, bad) => {
        redis_client.get(user_id, (err, reply) => {
            if (err) bad(err);
            good(reply);
        })
    });
}

/** 
* Save user data to reds cache
 * @param {string} user_id unique user identifier
 * @param {JSON} data json encode string to be saved (JSON.stringify(data))
 */
const save_data = (user_id, data = '') => {
    return new Promise((good, bad) => {
        console.info('[redis] save data');
        redis_client.set(user_id, data, (err, reply) => {
            if (err) bad(err);
            good(reply);
        });
    });
}


module.exports = {
    save_data,
    get_data
};