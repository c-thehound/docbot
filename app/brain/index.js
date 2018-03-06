/**
 * DocBot's brain
 * Use the data gathering sources and classifiers to build the bots brain
*/
const natural = require('natural');
const diseases = require('../utils/supported_illnesses');
const Wikipedia = require('../models/wikipedia');
const classifier_model = require('../models/classifier');
const entity_model = require('../models/entity');

const wiki_bot = new Wikipedia();
const classifier = new natural.BayesClassifier();

// fetch all disease data
const crawl = () => {
    const promises = [];
    for (let d in diseases) {
        const disease = diseases[d];
        promises.push(
            wiki_bot.find_condition(disease)
        );
    }
    return Promise.all(promises);
}

// persist the crawled data to the database
const crawl_persist = () => {
    return crawl().then(responses => {
        let records = [];
        responses.map(response => {
            const { entity } = response;
            const save_obj = {
                entity,
                name:           escape(response.name)                        ||  "",
                caption:        escape(response.caption)                     ||  "",
                type:           escape(response.type)                        ||  "",
                symptoms:       (typeof response.symptoms === 'object')      ?   JSON.stringify(response.symptoms)       : '{}',
                causes:         (typeof response.causes === 'object')        ?   JSON.stringify(response.causes)         : '{}',
                parse_data:     (typeof response.parse_data === 'object')    ?   JSON.stringify(response.parse_data)     : '[]',
                prevention:     (typeof response.prevention === 'object')    ?   JSON.stringify(response.prevention)     : '{}',
                diagnosis:      (typeof response.diagnosis === 'object')     ?   JSON.stringify(response.diagnosis)      : '{}',
                medication:     (typeof response.medication === 'object')    ?   JSON.stringify(response.medication)     : '{}',
                complications:  (typeof response.complications === 'object') ?   JSON.stringify(response.complications)  : '{}',
            };

            entity_model.update_or_save_entity(entity, save_obj)
                .then(entity => {
                    records.push(entity);
                })
        });
        return records;
    });
}

const classify_text = text => {
    return classifier_model.load_classifier('classifier_name', 'symptom_greeting')
        .then(cls => {
            const nlp = natural.BayesClassifier.restore(JSON.parse(raw.classifier_text));
            return nlp.getClassifications(text);
        });
}

const learn = () => {
    return crawl().then(responses => {
        responses.map(response => {
            const {
                entity,
                name,
                caption,
                type,
                symptoms,
                causes,
                parse_data
            } = response;
            
            if (name && name.length > 0) classifier.addDocument(name, entity);
            if (caption && caption.length > 0) classifier.addDocument(caption, entity);
            if (type && type.length > 0) classifier.addDocument(type, entity);

            if (causes && causes.desc) {
                classifier.addDocument(causes.desc, entity);
            }

            if (response.symptoms) {
                const { symptoms } = response;
                symptoms.map(symptom => classifier.addDocument(symptom, entity));
            }

            if (response.prevention) {
                const { prevention } = response;
                if (prevention.list) {
                    prevention.list.map(prev => classifier.addDocument(prev, entity));
                }

                if (prevention.conditions) {
                    prevention.conditions.map(cond => classifier.addDocument(cond, entity));
                }
            }

            if (response.complications) {
                const { complications } = response;
                if (complications.list) {
                    complications.list.map(comp => classifier.addDocument(comp, entity));
                }
            }
            
            parse_data.map(datum => {
                const {text, list} =  datum;
                classifier.addDocument(text, entity);
                if (list) {
                    list.map(el => {
                        classifier.addDocument(el, entity);
                    });
                }
            });

        });
    });
}


const learn_and_train = () => {
    return learn().then(() => {
        classifier.train();
        const raw = JSON.stringify(classifier);
        return classifier_model.update_or_save_classifier('symptom_greeting', raw)
            .then(success => success)
            .catch(err => {
                throw err;
                console.log('[fail] failed to save to database');
            });
    });
}

module.exports = {
    classify_text,
    learn_and_train,
    crawl,
    crawl_persist
}