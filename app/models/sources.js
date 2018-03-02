var db = require('../db');
/**
 * Insert api source data
 * @param {string} endpoint the url endpoint
 * @param {string} access_key 
 * @param {string} token access token
 * @param {number} expires how many seconds to expire
 * @param {string} api_name a short api name eg 'google_maps'
 * @returns {Promise<any>}
 */
exports.insert_source = (endpoint, access_key = '', token, expires, api_name = '') => {
    return db.insert({
        endpoint,
        access_key,
        token,
        expires,
        api_name
    })
    .into('api_sources');
}
/**
 * Get all sources
 * @param {string} filter_key - where key
 * @param {string} filter_value - = value
 * @returns {Promise<any>}
 */
exports.get_sources = (filter_key = '', filter_value = '') => {
    if (filter_key.length > 0 && filter_value.length > 0) {
        return db.select('*')
            .from('api_sources')
            .where(filter_key, filter_value)
    }
    return db.select('*').from('api_sources');
}
/**
 * Update a source
 * @param {number} source_id - the table column id
 * @param {Object} data - the key value data to update with
 * @returns {Promise<any>}
 */
exports.update_source = (source_id, data) => {
    return db('api_sources').where('id', source_id).update(data);
}