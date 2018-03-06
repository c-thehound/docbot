const wtf = require('wtf_wikipedia');
/**
 * @class Wikipedia
 * @classdesc Wkipedia http api wrapper
 * @this Wikipedia
 * @author pozy<masikapolycarp@gmail.com>
*/
class Wikipedia {
    /**
     * Finds a topic from wikipedia's api.
     * this may fail for non-disease terms so please keep the terms medical
     * @param {string} condition_title - the medical condition ege Malaria
     */
    find_condition (condition_title = '') {
        return new Promise ((good, bad) => {
            // check out more here https://github.com/spencermountain/wtf_wikipedia
            wtf.from_api(condition_title, 'en', (markup) => {
                const data = wtf.parse(markup);
                // the object containing all important data
                const parsed_response = {
                    // generate a slug to be used as entity during nlp
                    entity: condition_title.toLocaleLowerCase().replace(/\s+/g, '_'),
                    parse_data: [],
                };
                const { infoboxes, sections } = data;
                if (infoboxes) {
                    infoboxes.map(info => {
                        const { data } = info;
                        // wikipedia throws a lot of unexpected object keys
                        parsed_response.name = data['Name'] ? data['Name'].text : data.name.text || "";
                        parsed_response.caption = data['Caption'] ? data['Caption'].text : data.caption ? data.caption.text : "";
                        parsed_response.type = data.field ? data.field.text : "";
                        parsed_response.symptoms = data.symptoms ? data.symptoms.text.split(',').map(s => s.trim()) : null;

                        if (data.complications) {
                            parsed_response.complications = {
                                list: data.complications.text.split(','),
                                conditions: data.complications.links && data.complications.links.map(link => link.text)
                            };
                        }

                        if(data.causes) {
                            parsed_response.causes = {
                                desc: data.causes.text,
                                list: data.causes.links && data.causes.links.map(link => link.text)
                            };
                        }

                        if (data.diagnosis) {
                            parsed_response.diagnosis = {
                                desc: data.diagnosis.text,
                                list: data.diagnosis.links && data.diagnosis.links.map(link => link.text)
                            };
                        }

                        if (data.prevention) {
                            parsed_response.prevention = {
                                list: data.prevention.text.split(','),
                                conditions: data.prevention.links && data.prevention.links.map(link => link.text)
                            };
                        }

                        if (data.medication) {
                            parsed_response.medication = {
                                desc: data.medication.text,
                                list: data.medication.links && data.medication.links.map(link => link.text)
                            };
                        }
                    });
                    
                    sections.map(section => {
                        const { sentences } = section;
                        const parse_data = [];
                        sentences.map(sentence => {               
                            parsed_response.parse_data.push({
                                text: sentence.text,
                                list: sentence.links && sentence.links.map(link => link.text)
                            });
                        });
                    });
                }
                good(parsed_response);
            });
        });
    }
}

module.exports = Wikipedia;