const db = require('../db');
const table_name = 'classifiers';
/**
 * Updates a classifier record if exists or creates one otherwise
 * @param {string} classifier_name - the classifier name
 * @param {string} classifier_text - the JSON text
 * @returns {Promise<any>}
 */
exports.update_or_save_classifier = (classifier_name, classifier_text = '') => {
    return db.select('*')
        .from(table_name)
        .where('classifier_name', classifier_name)
    .then(data => {
        if (data && data.length > 0) {
            // time to update it
            const { id } = data[0];
            return db(table_name)
                .where('id', id)
                .update({ classifier_text });
        }
        // if we are here then create the new record
        return db.insert({
            classifier_name,
           classifier_text
        })
        .into(table_name);
    });
}
/**
 * Get a classifier
 * @param {string} filter_key - where key
 * @param {string} filter_value - = value
 * @returns {Promise<any>}
 */
exports.load_classifier = (filter_key = '', filter_value = '') => {
   if (filter_key.length > 0 && filter_value.length > 0) {
        return db.select('*')
            .from(table_name)
            .where(filter_key, filter_value)
            .then(response => {
                // returns only one record - is this neccessary? yes for now?
                return response[0];
            })
    }
    return db.select('*').from(table_name);
}

