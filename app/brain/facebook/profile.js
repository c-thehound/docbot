const axios = require('axios');
const config = require('../../../config')();
/**
 * Get user's profile information
 * @param {number} user_id user's conversation unique identifier (psid)
 */
module.exports = (user_id) => {
    return axios({
        method: 'get',
        url: 'https://graph.facebook.com/v2.6/' + user_id,
        params: {
            access_token: config.FB_PAGE_ACCESS_TOKEN,
            fields: 'first_name,last_name,gender'
        }
    }).then(resp => resp.data);
}