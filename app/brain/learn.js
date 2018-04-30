const crawl = require('./crawl');
const greetings = require('../intents/greetings');
const natural = require('natural');
const classifier_model = require('../models/classifier');
const commands = require('../entities/commands');
const classifier = new natural.BayesClassifier();
/**
 * Build the neural net
*/
async function learn () {
    const crawl_data =  await crawl();
    crawl_data.map(response => {
        const {
            entity,
            name,
            caption,
            type,
            symptoms,
            causes,
            parse_data
        } = response;

        if (name && name.length > 0)        classifier.addDocument(name, entity);
        if (caption && caption.length > 0)  classifier.addDocument(caption, entity);
        if (type && type.length > 0)        classifier.addDocument(type, entity);
        if (causes && causes.desc)          classifier.addDocument(causes.desc, entity);
        if (response.symptoms)              response.symptoms.map(symptom => classifier.addDocument(symptom, entity));

        if (response.prevention) {
            const { prevention } = response;
            if (prevention.list) prevention.list.map(prev => classifier.addDocument(prev, entity));
            if (prevention.conditions) prevention.conditions.map(cond => classifier.addDocument(cond, entity));
        }

        if (response.complications) {
            const { complications } = response;
            if (complications.list) complications.list.map(comp => classifier.addDocument(comp, entity));
        }

        if (parse_data) {
            parse_data.map(datum => {
                const { text, list } = datum;
                classifier.addDocument(text, entity);
                if (list) {
                    list.map(el => classifier.addDocument(el, entity));
                }
            });
        }
    });
    // lets not forget to train the classifier to recognise greetings too
    greetings.expressions.map(expression => {
        classifier.addDocument(expression, greetings.intent);
    });
    // train commands
    commands.map(command => {
        const { name, messages } = command;
        messages.map(message => {
            classifier.addDocument(message, name);
        });
    })
}

async function learn_and_train () {
    const teach = await learn();
    classifier.train();
    const raw = JSON.stringify(classifier);
    return classifier_model.update_or_save_classifier('symptom_greeting', raw)
        .then(success => success)
        .catch(err => {
            throw err;
            console.log('[fail] failed to save to database');
        });
}

module.exports = learn_and_train;