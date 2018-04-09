const config = require('../../config')();
const { classify_text, get_classifications, close_enough } = require('./classify_text');
const get_entity_questions = require('./get_entity_questions');
const greetings = require('../intents/greetings');
const responses = require('./responses');
const generate_question = require('./question_generator');
const entity_model = require('../models/entity');
const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const fb_send_message = require('./facebook/send_message');
const fb_upload_file = require('./facebook/upload_file');
const fb_update_home_screen = require('./facebook/homepage');
const fb_profile = require('./facebook/profile');
const is_emoji = require('./facebook/detect_emoji');
const commands = require('../entities/commands');
const makes_sense = require('./makes_sense');
const { get_data, save_data, reset_data } = require('./cache');
const diagnosis_model = require('../models/diagnosis');
const generate_report = require('../utils/generate_report');
const constants = require('../../constants');
const telegram_analyze = require('./telegram/analyze_input');
const fb_analyze = require('./facebook/analyze_input');
/**
 * Process user input
 * @param {Object} webhook_event - Facebook messenger webhook event or telegram message event
 */
module.exports = async function (webhook_event) {
    let user_id = webhook_event.from ? webhook_event.from.id : webhook_event.sender.id;
    let user_data = await get_data(user_id);
    if (user_data === null) {
        const save_status = await reset_data(user_id);
    }

    if (webhook_event.from) {
        // this is a telegram message
        return telegram_analyze(user_data, webhook_event);
    } else {
        // this is a facebook messenger message
        const { message, postback } = webhook_event;
        return fb_analyze(user_id, user_data, message || postback);
    }
}

