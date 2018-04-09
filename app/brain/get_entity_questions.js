const entity_model = require('../models/entity');
const generate_question = require('./question_generator');
const map = require('lodash/map');
const uuidv4 = require('uuid/v4');
/**
 * Takes an entity list and throws out all questions for the entitites
 * @param {Array} entities the list of entities
 * @returns {Array}
 */
async function get_entity_questions(entities = []) {
    const questions = [];

    for (let entity in entities) {
        const data = await entity_model.load_entity('entity', entities[entity], ['id', 'entity', 'symptoms']);
        if (data && data.symptoms) {
            const generated = generate_question(JSON.parse(data.symptoms));
            const formatted = {
                entity: entities[entity],
                questions: map(generated, qs => {
                    return {
                        question: qs,
                        entity: entities[entity],
                        id: entities[entity] + '_' + uuidv4(),
                        asked: false,
                        score: 0
                    };
                })
            }

            questions.push(formatted);
        }
    }

    return questions;
}

module.exports = get_entity_questions;