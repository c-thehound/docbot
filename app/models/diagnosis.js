const table_name = 'diagnosis';
const db = require('../db');
/**
 * Get diagnosis of user(s)
 * @param {string} filter_key - where key
 * @param {string} filter_value - value
 * @param {Array[string]} select_list - what will be selected from db
 * @returns {Promise<any>}
 */
exports.load_diagnosis = (filter_key = '', filter_value = '', select_list = []) => {
    if (filter_key.length > 0 && filter_value.length > 0) {
        return db.select(...select_list)
            .from(table_name)
            .where(filter_key, filter_value)
            .then(response => response)
    }
    return db.select(select_list).from(table_name);
}

/**
 * Save a diagnosis to our database
 * @param {number} user_id - user's unique id
 * @param {string} diagnosis - json encoded diagnosis
 */
exports.save_diagnosis = (user_id, diagnosis) => {
    return db.insert({
        user_id,
        diagnosis
    })
     .into(table_name);
}