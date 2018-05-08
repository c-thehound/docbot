const crawl = require('./crawl');
const assign = require('lodash/assign');
const entity_model = require('../models/entity');
// used to find medication related sentences
const hot_keywords = [
    'treatment',
    'treat',
    'medication'
]
/**
 * Persist crawled data to the database
*/
async function crawl_persist () {
    const crawl_data = await crawl();
    const records  = [];
    crawl_data.map(async (response) => {
        const { entity, medication } = response;
        let save_obj = {
            entity,
            name:           escape(response.name)                           || "",
            caption:        escape(response.caption)                        || "",
            type:           escape(response.type)                           || "",
            symptoms:       (typeof response.symptoms === 'object')         ?  JSON.stringify(response.symptoms)         : '{}',
            causes:         (typeof response.causes === 'object')           ?  JSON.stringify(response.causes)           : '{}',
            parse_data:     (typeof response.parse_data === 'object')       ?  JSON.stringify(response.parse_data)       : '[]',
            prevention:     (typeof response.prevention === 'object')       ?  JSON.stringify(response.prevention)       : '{}',
            diagnosis:      (typeof response.diagnosis === 'object')        ?  JSON.stringify(response.diagnosis)        : '{}',
            medication:     (typeof response.medication === 'object')       ?  JSON.stringify(response.medication)       : '{}',
            complications:  (typeof response.complications === 'object')    ?  JSON.stringify(response.complications)    : '{}',
            images:         (typeof response.images === 'object')           ?  JSON.stringify(response.images)           : '[]'
        };

        if (!response.medication) {
            let extra_data = [];
            response.parse_data.map(parse_data_item => {
                const { text } = parse_data_item;
                let contains_hot_words = hot_keywords.filter(keyword => {
                    return text.indexOf(keyword) !== -1;
                });
   
                if (contains_hot_words.length > 0) {
                    extra_data.push(text);
                }
            });
            save_obj.medication = JSON.stringify(extra_data);
        }
        records.push(entity);
        await entity_model.update_or_save_entity(entity, save_obj);
    });

    return records;
}

module.exports = crawl_persist;
