const crawl = require('./crawl');
const entity_model = require('../models/entity');
/**
 * Persist crawled data to the database
*/
async function crawl_persist () {
    const crawl_data = await crawl();
    const records  = [];
    crawl_data.map(response => {
        const { entity } = response;
        const save_obj = {
            entity,
            name: escape(response.name) || "",
            caption: escape(response.caption) || "",
            type: escape(response.type) || "",
            symptoms: (typeof response.symptoms === 'object') ? JSON.stringify(response.symptoms) : '{}',
            causes: (typeof response.causes === 'object') ? JSON.stringify(response.causes) : '{}',
            parse_data: (typeof response.parse_data === 'object') ? JSON.stringify(response.parse_data) : '[]',
            prevention: (typeof response.prevention === 'object') ? JSON.stringify(response.prevention) : '{}',
            diagnosis: (typeof response.diagnosis === 'object') ? JSON.stringify(response.diagnosis) : '{}',
            medication: (typeof response.medication === 'object') ? JSON.stringify(response.medication) : '{}',
            complications: (typeof response.complications === 'object') ? JSON.stringify(response.complications) : '{}',
        };

        entity_model.update_or_save_entity(entity, save_obj)
            .then(() => records.push(entity));
    });

    return records;
}

module.exports = crawl_persist;
