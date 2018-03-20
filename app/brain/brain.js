/**
 * DocBot's brain
 * Use the data gathering sources and classifiers to build the bots brain
 * @author Pozy <masikapolycarp@gmail.com>
*/
const natural = require('natural');
const classifier_model = require('../models/classifier');
const generate_questions = require('./question_generator');
const process_input = require('./process_input');
const classify_text = require('./classify_text');
const crawl = require('./crawl');
const crawl_persist = require('./crawl_persist');
const learn_and_train = require('./learn');
const _ = require('lodash');

/**
 * Get all questions from all entitites
 * Use this to test this functionality
 */
const all_questions = () => {
    return entity_model.load_entity('', '', ['id', 'entity', 'symptoms'])
        .then(responses => {
            let data = [];
            responses.map(r => {
                const symptoms = JSON.parse(r.symptoms);
                data.push(_.assign({}, r, {questions: generate_questions(symptoms)}));
            });
            return data;
        })
        .catch(err => err);
}


module.exports = {
    classify_text,
    learn_and_train,
    crawl,
    crawl_persist,
    all_questions,
    process_input
}