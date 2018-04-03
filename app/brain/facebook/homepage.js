const axios = require('axios');
const config = require('../../../config')();
/**
 * utitlity function that updates the bots home screen page on messenger
 * this should only be called once ideally
 */
module.exports = () => {
    // Construct the message body
    let request_body = {
        "greeting": [
            {
                "locale": "default",
                "text": "Hello {{user_first_name}}! Welcome to DocBot. Your personal health assistant."
            },
        ],
        "get_started": {
            "payload" : "FIRST_TIME_USER"
        }
    }

    return axios({
        method: 'post',
        url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        data: request_body,
        params: {
            access_token: config.FB_PAGE_ACCESS_TOKEN
        }
    });
}