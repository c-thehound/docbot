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
// local slimbot instance
let bot = {};
/**
 * Telegram Analyzer
 * Analyzes user's input to determine correct response
 * @param {Object} user_obj - redis cached object
 * @param {string | object} input - what the user typed in 
 */
const analyze_input = async (user_obj, input) => {
    const { from: { id, first_name, last_name }, text, telegram_bot, postback } = input;
    let user_data = JSON.parse(user_obj);
    bot = telegram_bot;
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

    // what the user receives on first launch
    if (text === '/start') {
        const welcome = `Hello ${first_name || 'there'}! I'm DocBot, your new health assistant.`;
        await bot.sendMessage(id, welcome);
        await bot.sendMessage(id, 'Tell me about your symptoms');
        await bot.sendMessage(id, 'For example "my stomach hurts" or "i feel cold"');
        return;
    }

    if (greetings) {
        // greet the user back
        return bot.sendMessage(id, sample(responses.greetings));
    }

    if (matches_command.length > 0) {
        // if i don't have any data on user, ignore the reset command
        if (!user_data.symptom_questions) {
            await bot.sendMessage(id, "No need to reset my session.");
            await bot.sendMessage(id, "Just tell me about your condition.");
            return;
        }

        await bot.sendMessage(id, "Ok. Five me a sec to reset the conversation");
        const save_status = await reset_data(id);
        await bot.sendMessage(id, "👍 Done! Let's start over.");
        return;
    }

    if (matches_download.length > 0) {
        generate_report(id).then(async (filename) => {
            await bot.sendMessage(id, "Please wait while i generate a report");
            await bot.sendDocument(id, `${config.BASE_URL}/pdf/${filename}`);
            await bot.sendMessage(id, "I've just sent the file. Download to view");
            await bot.sendMessage(id, `If you can't see the file, click here to download ${config.BASE_URL}/pdf/${filename}`);
        }).catch(error => {
            console.log(error);
            if (error === 'no_data') {
                bot.sendMessage(id, "No medical history found.");
            } else {
                bot.sendMessage(id, '😢 Sorry! A problem occured when trying to send you the file');
                bot.sendMessage(id, 'Please try later');
            }
        })
        return;
    }

    // ignore emoji messages
    if (
        is_emoji(text)
    ) {
        return bot.sendMessage(id, sample(responses.emojis));
    }

    // last chance if we can't understand
    if (text && !good_sentense) {
        await bot.sendMessage(id, capitalize(sample(responses.cant_understand)));
        await bot.sendMessage(id, 'Type in symptom related stuff');
        await bot.sendMessage(id, 'Something like "I have a headache" or "i have a fever"');

        return;
    }

    if (postback) {
        if (postback === responses.useful_types.USEFUL) {
            // great! we can save diagnosis and refresh cache
            await bot.sendMessage(id, 'Awesome! Glad i helped.');
            // i think it's time for ways of treatment
            console.log(user_data);
            if (user_data.medication) {
                console.log(user_data.medication);
                await bot.sendMessage(id, "Here's a recommendation of treatment");
                if (Array.isArray(user_data.medication)) {
                    let med = user_data.medication.slice(0, 2);
                    med.map(async (sentence) => {
                        await bot.sendMessage(id, sentence);
                    });
                } else {
                    await bot.sendMessage(id, user_data.medication.desc);
                }
            }
            //
            await diagnosis_model.save_diagnosis(id, JSON.stringify(user_data.diagnosis));
            await reset_data(id);
            return;
        }

        if (postback === responses.useful_types.NO) {
            await bot.sendMessage(id, `Too bad, i'll try to do better next time`);
            return;
        }

        if (postback === responses.useful_types.MAYBE) {
            await bot.sendMessage(id, 'I may have not understood your text correctly.');
            await bot.sendMessage(id, 'Try restarting me by typing "boot" or "start over" and then type a more detailed symptom');
            return;
        }

        const [ question_id, succeeded ] = postback.split('|');
        const [ payload_entity ] = question_id.split('_');
        // this will be cached for later analysis
        let current_question = {};
        const updated_questions = map(user_data.symptom_questions, (entity_object) => {
            let { entity, questions } = entity_object;

            if (entity === payload_entity) {
                questions = questions.map(question => {
                    if (question.id === question_id) {
                        let score = 0;

                        if (succeeded === responses.responses_types.YES) {
                            score = 1;
                        } else if (succeeded === responses.responses_types.NOT_SURE) {
                            score = .5;
                        }

                        const q = assign({}, question, { asked: true, score });
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

    }

    // generate questions from user text
    if (
        !user_data ||
        !user_data.symptom_questions
    ) {
        const classifications = await get_classifications(text);
        // choose top 5 entitites from response
        // _.sortyBy returns an ascending array
        const top_intents = sortBy(classifications, ['value']).reverse().slice(0, 5);

        const labels = map(top_intents, i => i.label);
        const symptom_questions = await get_entity_questions(labels);
        // a group of questions to ask user
        const ui_questions = [];

        forEach(symptom_questions, (entity_object) => {
            const { entity, questions } = entity_object;
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

        const save = await save_data(id, JSON.stringify(data));
        user_data = data;
    }

    const { symptom_questions, classifications, cached_questions } = user_data;
    // select the top most question and ask user
    const question = cached_questions.shift();
    let response = null;

    if (question) {
        response = {
            parse_mode: 'Markdown',
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: 'Yes',
                            callback_data: [
                                question.id,
                                responses.responses_types.YES
                            ].join('|')
                        },
                        {
                            text: 'No',
                            callback_data: [
                                question.id,
                                responses.responses_types.NO
                            ].join('|')
                        },
                        {
                            text: "I'm not sure",
                            callback_data: [
                                question.id,
                                responses.responses_types.NOT_SURE
                            ].join('|')
                        },
                    ]
                ]
            })
        };

        await bot.sendMessage(id, question.question, response);
    } else {
        // if here it means we are done with acquiring information and shoud now process requests
        // time to score the responses
        const { answers } = user_data;
        let diagnosis = {
            answers
        };
        const scores = {};
        // just a key value store of entity and score
        // eg { malaria: 6}
        answers.map(answer => {
            scores[answer.entity] = scores[answer.entity] ? (scores[answer.entity] += answer.score) : answer.score;
        });

        let sorted_scores = sortBy(
            map(scores, (val, key) => {
                return { entity: key, score: val }
            }),
            ['score']
        ).reverse();

        if (sorted_scores.length === 0) {
            // another instance of understood text that sneeked thorugh oour filtersconst
            await bot.sendMessage(id, 'It looks like i could not understand your message.');
            await bot.sendMessage(id, 'If this persists, restart me by texting "reboot" or "start over"');

            return;
        }

        const first = sorted_scores[0];
        const entity_data = await entity_model.load_entity('entity', first.entity, ['name', 'images', 'parse_data', 'medication']);
        let { name, medication } = entity_data;
        name = unescape(name) || capitalize(first.entity.split('_'));
        const images = JSON.parse(entity_data.images);
        const extra = JSON.parse(entity_data.parse_data);
        const info = extra[0].text;
        const chunked_messages = info.split('.');
        const chunked_promises = [];
        const feedback = [
            bot.sendMessage(id, 'That is enough for now'),
            bot.sendMessage(id, 'Let me try and see if i can identify the problem'),
        ];

        diagnosis.illness = name;
        diagnosis.info = info;
        diagnosis.medication = medication;

        await Promise.all(feedback);
        // tell diagnosis
        await bot.sendMessage(id, `From my calculations, it is highly possible that you have ${name}.`);
        // maybe tell the user what the disease looks like?
        if (images.length > 0 && images[0].url) {
            await bot.sendMessage(id, `Here's what ${name} looks like`);
            await bot.sendPhoto(id, images[0].url);
        }
        // just in case the description is long chunk it into sentences
        chunked_messages.map(message => {
            if (message.length > 0) {
                chunked_promises.push(
                    bot.sendMessage(id, message)
                )
            }
        });

        await Promise.all(chunked_promises);

        // try and see if what i asked is useful at all to the user
        await bot.sendMessage(
            id,
            sample(responses.useful),
            {
            parse_mode: 'Markdown',
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: 'Yes, it helped',
                            callback_data: responses.useful_types.USEFUL
                        },
                        {
                            text: 'No',
                            callback_data: responses.useful_types.NOT_USEFUL
                        },
                        {
                            text: "I'm not sure",
                            callback_data: responses.useful_types.MAYBE
                        },
                    ]
                ]
            })
        });

        user_data = assign(user_data, { diagnosis });
    }
    // always save to persist our state
    const save_status = await save_data(id, JSON.stringify(user_data));
    
}

module.exports = analyze_input;