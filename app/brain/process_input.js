const redis = require('redis');
const config = require('../../config');
const redis_client = redis.createClient(config.REDIS_PORT);
const text_classifier = require('./classify_text');
const greetings = require('../intents/greetings');
const responses = require('./responses');
const generate_question = require('./question_generator');
const entity_model = require('../models/entity');
const _ = require('lodash');
const uuidv4 = require('uuid/v4');
/**
 * Process user input
 * @param {Object} req - express request object
 */
module.exports = async function (req) {
    const { user_id, message } = req.body;
    let user_data = await get_data(user_id);
    if (user_data === null) {
        const save_status = await save_data(user_id, '{}');
    }

    let analysis = await analyze_input(user_id, user_data, message);
    return analysis;
}

/**
 * Analyzes user's input to determine correct response
 * @param {string} user_id - the user's unique identifier
 * @param {Object} user_obj - redis cached object
 * @param {string} input - what the user typed in 
 */
async function analyze_input (user_id, user_obj, input) {
    const specific_class = await text_classifier.classify_text(input);
    let user_data = JSON.parse(user_obj);
    if (specific_class === greetings.intent) {
        // respond with something witty here
        const response = _.sample(responses.greetings);
        return {
            response
        }
    }
    // respond to other things
    if (
        !user_data||
        !user_data.symptom_questions
    ) {
        const classifications = await text_classifier.get_classifications(input);
        // choose top 5 entitites from response
        // _.sortyBy returns an ascending array
        const top_intents = _.sortBy(classifications, ['value']).reverse().slice(0, 5);
        const labels = _.map(top_intents, i => i.label);
        const symptom_questions = await get_entity_questions(labels);
        // save this to cache
        const data = _.assign({}, user_data, {
            symptom_questions,
            classifications: top_intents,
        });
        const save = await save_data(user_id, JSON.stringify(data));
        user_data = data;
    }

    const { symptom_questions, classifications } = user_data;
    const ui_questions = [];

    _.forEach(symptom_questions, (entity_object) => {
        const { entity, questions } = entity_object;
        if (questions.length > 0) {
            // don't repeat the same questions
            const unasked = _.filter(questions, q => !q.asked);
            ui_questions.push(_.sample(unasked));
        }
    });

    // select the first valid question and ask the user
    const question = _.head(ui_questions);

    return {
        user_id,
        input,
       question: question.question,
       classifications
    };
}

async function get_entity_questions (entities = []) {
    const questions = [];

    for (let entity in entities) {
        const data = await entity_model.load_entity('entity', entities[entity], ['id', 'entity', 'symptoms']);
        const generated = generate_question(JSON.parse(data.symptoms));
        const formatted = {
            entity: entities[entity],
            questions: _.map(generated, qs => {
                return {
                    question: qs,
                    id: entities[entity] + '_' + uuidv4(),
                    asked: false,
                    score: 0
                };
            })
        }
       
        questions.push(formatted);
    }

    return questions;
}

const get_data = (user_id) => {
    console.info('[redis] get data');
    return new Promise ((good, bad) => {
        redis_client.get(user_id, (err, reply) => {
            if (err) bad(err);
            good(reply);
        })
    });
}

const save_data = (user_id, data = '') => {
    return new Promise ((good, bad) => {
        console.info('[redis] save data');
        redis_client.set(user_id, data, (err, reply) => {
            if (err) bad(err);
            good(reply);
        });
    });
}