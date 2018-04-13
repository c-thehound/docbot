const {
    save_data,
    reset_data,
    get_data
} = require('../cache');
const config = require('../../../config')();
const {
    classify_text,
    get_classifications,
    close_enough
} = require('../classify_text');
const greetings = require('../../intents/greetings');
const responses = require('../responses');
const generate_question = require('../question_generator');
const entity_model = require('../../models/entity');
const diagnosis_model = require('../../models/diagnosis');
const filter = require('lodash/filter');
const capitalize = require('lodash/capitalize');
const find = require('lodash/find');
const forEach = require('lodash/forEach');
const chain = require('lodash/chain');
const sample = require('lodash/sample');
const sampleSize = require('lodash/sampleSize');
const assign = require('lodash/assign');
const sortBy = require('lodash/sortBy');
const map = require('lodash/map');
const is_emoji = require('../facebook/detect_emoji');
const commands = require('../../entities/commands');
const makes_sense = require('../makes_sense');
const generate_report = require('../../utils/generate_report');
const get_entity_questions = require('../get_entity_questions');
const fb_send_message = require('./send_message');
const fb_upload_file = require('./upload_file');
const fb_update_home_screen = require('./homepage');
const fb_profile = require('./profile');

/**
 * Analyzes user's input to determine correct response
 * @param {string} user_id - the user's unique identifier
 * @param {Object} user_obj - redis cached object
 * @param {string | object} input - what the user typed in 
 */
const analyze_input = async (user_id, user_obj, input) => {
    let user_data = JSON.parse(user_obj);

    if (config.FB_HOME_SCREEN_SET) {
        await fb_update_home_screen();
    }
    // the first time a user opens a conversation this is sent
    if (input.payload && input.payload === constants.FIRST_TIME_USER) {
        const profile = await fb_profile(user_id);
        const welcome = `Hello ${profile ? profile.first_name : ' there '}! I'm DocBot, your new health assistant.`;
        await send_message(user_id, welcome);
        await fb_send_message(user_id, {
            text: 'Are you ready to take charge of your health?',
            quick_replies: [{
                "content_type": "text",
                "title": "Let's go!",
                "payload": constants.GET_STARTED
            }]
        });
        return;
    }

    // payload is usually the user's response when asked a question
    if (input.quick_reply) {
        // we'll depend on json.parse breaking to filter out non json content
        try {
            const payload = JSON.parse(input.quick_reply.payload);
            // this will be cached for later analysis
            let current_question = {};
            const updated_questions = map(user_data.symptom_questions, (entity_object) => {
                let {
                    entity,
                    questions
                } = entity_object;

                if (entity = payload.entity) {
                    questions = questions.map(question => {
                        if (question.id === payload.question_id) {
                            let score = 0;

                            if (
                                payload.succeeded === responses.responses_types.YES
                            ) {
                                score = 1;
                            } else if (
                                payload.succeeded === responses.responses_types.NOT_SURE
                            ) {
                                score = .5;
                            }

                            const q = assign({}, question, {
                                asked: true,
                                score
                            });
                            current_question = q;
                            return q;
                        }

                        return question;
                    });
                }
                // this is just the modified entity_object
                return {
                    entity,
                    questions
                };
            });

            user_data = assign({}, user_data, {
                symptom_questions: updated_questions,
                answers: user_data.answers.concat(current_question)
            });
        } catch (e) {
            // this is not json so parse as normal strings
            const {
                payload
            } = input.quick_reply;
            
            if (payload === responses.useful_types.USEFUL) {
                // great! we can save diagnosis and refresh cache
                await fb_send_message(user_id, {
                    text: 'Awesome! Glad i helped.'
                });

                await diagnosis_model.save_diagnosis(user_id, JSON.stringify(user_data.diagnosis));
                await reset_data(user_id);
                return;
            }
            // after user presses let's go!
            if (payload === constants.GET_STARTED) {
                await send_message(user_id, 'Tell me about your symptoms');
                await send_message(user_id, 'For example "my stomach hurts" or "i feel cold"');
                return;
            }

        }

    } else {
        // respond to user answers
        const {
            text,
            nlp
        } = input;
        const start_command = find(commands, c => c.name === 'restart');
        const download_command = find(commands, c => c.name === 'download_report');
        // recognise basic text meanings such as thank you messages
        const greetings = await classify_text(text) === 'greetings';
        // don't continue if the user sent useless text
        const good_sentense = await makes_sense(text);
        // reset cache command
        const matches_command = filter(start_command.messages, message => {
            return text && close_enough(message, text);
        });
        // download report command
        const matches_download = filter(download_command.messages, m => {
            return text && close_enough(m, text);
        });

        if (greetings) {
            // greet the user back
            // greet user here
            return fb_send_message(user_id, {
                "text": sample(responses.greetings)
            });
        }

        if (matches_command.length > 0) {
            // if i don't have any data on user, ignore the reset command
            if (!user_data.symptom_questions) {
                await fb_send_message(user_id, {
                    "text": "No need to reset my session."
                });
                await fb_send_message(user_id, {
                    "text": "Just tell me about your condition."
                });
                return;
            }

            await fb_send_message(user_id, {
                "text": "Ok. Five me a sec to reset the conversation"
            });
            const save_status = await reset_data(user_id);
            await fb_send_message(user_id, {
                "text": "Done! Let's start over."
            });
            return;
        }

        if (matches_download.length > 0) {
            generate_report(user_id).then(async (filename) => {
                await fb_send_message(user_id, {
                    "text": "Please wait while i generate a report"
                });
                await fb_upload_file(user_id, `${config.BASE_URL}/pdf/${filename}`, 'file');
                await fb_send_message(user_id, {
                    "text": "I've just sent the file. Download to view"
                });
            }).catch(error => {
                if (error === 'no_data') {
                    fb_send_message(user_id, {
                        text: "No medical history found. "
                    });
                }
            })
            return;
        }

        // ignore emoji messages
        if (
            is_emoji(text) ||
            (input.sticker_id && input.sticker_id === config.FB_LIKE_BUTTON_ID)
        ) {
            return fb_send_message(user_id, {
                "text": sample(responses.emojis)
            });
        }

        // last chance if we can't understand
        if (!good_sentense) {
            await fb_send_message(
                user_id, {
                    text: capitalize(sample(responses.cant_understand))
                }
            );

            await fb_send_message(
                user_id, {
                    text: 'Type in symptom related stuff'
                }
            );

            await fb_send_message(
                user_id, {
                    text: 'Something like "I have a headache" or "i have a fever"'
                }
            );

            return;
        }

        // generate questions from user text
        if (!user_data ||
            !user_data.symptom_questions
        ) {
            const classifications = await get_classifications(text);
            // choose top 5 entitites from response
            // sortyBy returns an ascending array
            const top_intents = sortBy(
                classifications, ['value']
                )
                .reverse()
                .slice(0, 5);

            const labels = map(top_intents, i => i.label);
            const symptom_questions = await get_entity_questions(labels);
            // a group of questions to ask user
            const ui_questions = [];

            forEach(symptom_questions, (entity_object) => {
                const {
                    entity,
                    questions
                } = entity_object;
                // don't repeat the same questions
                const unasked = filter(questions, q => !q.asked);

                if (unasked.length > 0) {
                    // take 2 questions
                    // TODO: Is this enough
                    const samples = sampleSize(unasked, 2);
                    samples.map(q => ui_questions.push(q));
                }

            });

            // save this to cache
            let data = assign({}, user_data, {
                symptom_questions,
                classifications: top_intents,
                answers: []
            });

            if (!user_data.cached_questions) {
                data.cached_questions = ui_questions;
            }

            const save = await save_data(user_id, JSON.stringify(data));
            user_data = data;
        }
    }

    const {
        symptom_questions,
        classifications,
        cached_questions
    } = user_data;
    // select the top most question and ask user
    const question = cached_questions.shift();
    let response = null;

    if (question) {
        response = {
            text: question.question,
            quick_replies: [{
                    "content_type": "text",
                    "title": "Yes",
                    // this payload is important to track subsequent requests
                    "payload": JSON.stringify({
                        "question_id": question.id,
                        "succeeded": responses.responses_types.YES,
                        "entity": question.entity
                    })
                },
                {
                    "content_type": "text",
                    "title": "No",
                    "payload": JSON.stringify({
                        "question_id": question.id,
                        "succeeded": responses.responses_types.NO,
                        "entity": question.entity
                    })
                },
                {
                    "content_type": "text",
                    "title": "I'm not sure",
                    "payload": JSON.stringify({
                        "question_id": question.id,
                        "succeeded": responses.responses_types.NOT_SURE,
                        "entity": question.entity
                    })
                }
            ]
        }

    } else {
        // if here it means we are done with acquiring information and shoud
        // now process requests
        // time to score the responses
        const {
            answers
        } = user_data;
        let diagnosis = {
            answers
        };
        const scores = {};
        // just a key value store of entity and score
        // eg { malaria: 6}
        answers.map(answer => {
            scores[answer.entity] =
                scores[answer.entity] ?
                (scores[answer.entity] += answer.score) :
                answer.score;
        });

        let sorted_scores = sortBy(
            map(scores, (val, key) => {
                return {
                    entity: key,
                    score: val
                }
            }), ['score']
        ).reverse();

        if (sorted_scores.length === 0) {
            // another instance of understood text that sneeked thorugh oour filters
            await fb_send_message(user_id, {
                'text': 'It looks like i could not understand your message'
            });

            await fb_send_message(user_id, {
                'text': 'Sorry but you have to type something else'
            });

            await fb_send_message(user_id, {
                'text': 'If this persists, restart me by texting reboot or /start'
            });

            return;
        }

        const first = sorted_scores[0];
        const entity_data = await entity_model.load_entity(
            'entity',
            first.entity,
            ['name', 'images', 'parse_data']
        );
        let {name} = entity_data;
        name = unescape(name);
        const images = JSON.parse(entity_data.images);
        const extra = JSON.parse(entity_data.parse_data);
        const info = extra[0].text;
        const chunked_messages = info.split('.');
        const chunked_promises = [];
        const feedback = [
            fb_send_message(user_id, {
                "text": "That is enough for now"
            }),
            fb_send_message(user_id, {
                "text": "Let me try and see if i can identify the problem"
            }),
        ];

        diagnosis.illness = name;
        diagnosis.info = info

        await Promise.all(feedback);
        // tell diagnosis
        await fb_send_message(user_id, {
            "text": `From my calculations, it is highly possible that you have ${ name }.`
        });
        // maybe tell the user what the disease looks like?
        if (images.length > 0) {
            await fb_send_message(user_id, {
                "text": `Here's what ${name} looks like`
            });
            await fb_upload_file(user_id, images[0].url);
        }
        // just in case the description is long chunk it into sentences
        chunked_messages.map(message => {
            if (message.length > 0) {
                chunked_promises.push(
                    fb_send_message(user_id, {
                        "text": message
                    })
                )
            }
        });
        await Promise.all(chunked_promises);

        // try and see if what i asked is useful at all to the user
        await fb_send_message(user_id, {
            text: sample(responses.useful),
            quick_replies: [{
                    "content_type": "text",
                    "title": "Yes, you helped",
                    "payload": responses.useful_types.USEFUL
                },
                {
                    "content_type": "text",
                    "title": "No",
                    "payload": responses.useful_types.NOT_USEFUL
                },
                {
                    "content_type": "text",
                    "title": "i'm not sure",
                    "payload": responses.useful_types.MAYBE
                },
            ]
        });

        user_data = assign(user_data, {
            diagnosis
        });
    };

    // persist our state
    const save_status = await save_data(user_id, JSON.stringify(user_data));

    if (response) {
        await fb_send_message(user_id, response);
    }
}

/**
 * Utility function to find specific facebook entities
 * @param {Object} nlp - fb nlp object
 * @param {string} name - entity name
 */
const first_entity = (nlp, name) => {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}

/**
 * Proxy to fb send message
 * @param {number} user_id facebook psid
 * @param {string} text the message
 */
const send_message = (user_id, text) => {
    return fb_send_message(user_id, {
        text
    })
}

module.exports = analyze_input;