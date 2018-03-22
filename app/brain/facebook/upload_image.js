const axios = require('axios');
const config = require('../../../config');
/**
 * Uploads an image to a facebook user
 * @param {String} sender_psid unique converstion id of user
 * @param {String} url_path the url path for the uploaded image
 */
module.exports = async (sender_psid, url_path) => {
    // Construct the message body
    let request_body = {
        "messaging_type": "RESPONSE",
        "recipient": {
            "id": sender_psid
        },
        "message": {
            "attachment": {
                "type": "image",
                "payload": {
                    "is_reusable": true,
                    "url": url_path
                }
            }
        }
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