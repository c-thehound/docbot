const db = require('../db');
const table_name = 'entity_data';
/**
 * Updates an entity record if exists or creates one otherwise
 * @param {string} entity_name - the entity name
 * @param {Object} entity_values - the entity data
 * @returns {Promise<any>}
 */
exports.update_or_save_entity = (entity_name, entity_values = {}) => {
    // return new Promise((g, b) => { g(entity_values) });
    return db.select('*')
        .from(table_name)
        .where('entity', entity_name)
    .then(data => {
        if (data && data.length > 0) {
            // time to update it
            const { id } = data[0];
            return db(table_name)
                .where('id', id)
                .update(entity_values)
                .then(resp => entity_name)
        }
        // if we are here then create the new record
        return db.insert(entity_values)
        .into(table_name)
        .then(resp => entity_name)
    });
}

/**
 * Get an entity
 * @param {string} filter_key - where key
 * @param {string} filter_value - value
 * @param {string} select_text - what will be selected from db
 * @returns {Promise<any>}
 */
exports.load_entity = (filter_key = '', filter_value = '', select_text = '*') => {
   if (filter_key.length > 0 && filter_value.length > 0) {
        return db.select(select_text)
            .from(table_name)
            .where(filter_key, filter_value)
            .then(response => {
                // returns only one record - is this neccessary? yes for now?
                return response[0];
            })
    }
    return db.select(select_text).from(table_name);
}