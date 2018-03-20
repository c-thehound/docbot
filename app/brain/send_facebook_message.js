const axios = require('axios');
const config = require('../../config');
/**
 * utitlity function that sends a facebook message
 * @param {String} sender_psid  unique comversation id of the user
 * @param {Object} response_message message to send to user
 */
module.exports = async (sender_psid, response_message) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response_message
    }

    return axios({
        method: 'post',
        url: 'https://graph.facebook.com/v2.6/me/messages',
        data: request_body,
        params: {
            access_token: config.FB_PAGE_ACCESS_TOKEN
        }
    });
}