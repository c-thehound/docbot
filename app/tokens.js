'use strict';
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const endpoints = require('./utils/endpoints');
const sources = require('./models/sources');
/**
 * Gets APIMedic auth token
 * @returns {Promise<AXIOS.XHR>}
*/
const get_token = () => {
    const { token_auth_url, auth_details } = endpoints;
    const computedHash = crypto.createHmac('md5', auth_details.password).update(token_auth_url).digest('base64');
    // send request
    const headers = {
        'Authorization': `Bearer ${auth_details.username}:${computedHash}`,
        'Content-Type': 'application/json'
    }
    //
    return axios({
        method: 'POST',
        headers,
        url: token_auth_url,
        responseType: 'json'
    })
    .then(result => result.data)
    .catch(error => {
        const response = error.response;
        const { status, statusText, data } = response;
        console.log('[token_get_error]', status, statusText, authServiceUrl);
        return {
            status,
            statusText,
            data
        };
        
    })
}
/**
 * This means the token is expired or not there
 * @param {number} source_id -not required
 */
const update_or_save_token = (source_id) => {
    console.log('[token] attempting to update token');
    return get_token().then(response => {
        // update previos token
        if (source_id) {
            return sources.update_source(
                id,
                {
                    token: response.Token,
                    expires: response.ValidThrough
                }
            );
        }
        // create new record
        return sources.insert_source(
            endpoints.token_auth_url,
            '',
            response.Token,
            response.ValidThrough,
            'api_medic'
        )
    });
}
/**
 * checks whether a token is expired or not and updates if it is
 * @returns {knex-object}
 */
const refresh_token = () => {
    return sources.get_sources('api_name', 'api_medic')
        .then(data => {
            const source = data[0];
            if (source) {
                const { id, token, expires, time_added } = source;
                const prev = moment(time_added);
                const now = moment();
                const diff = now.diff(prev, 'seconds');
                // if the token has expired already you should refresh it
                if (diff >= expires) {
                    return update_or_save_token(id);
                }
                // no need of refreshing token
                console.log('[token] up to date already');
                return true;
            } else {
                // if i have no token already set or someone may have deleted accidentally
                // refetch again
                return update_or_save_token();

            }
        })
        .then(resp => resp)
        .catch(e => {
            console.log('[unexpected]', e);
            return false;
        });
}

exports.get_token = get_token;
exports.refresh_token = refresh_token;