const { get_data, reset_data } = require('./cache');
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

