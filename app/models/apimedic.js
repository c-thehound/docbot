'use strict';
const api_config = require('../utils/endpoints');
const axios = require('axios');
/**
 * @class APIMedic
 * @classdesc APIMedic http api wrapper
 * @this APIMedic
 * @author pozy<masikapolycarp@gmail.com>
*/
class APIMedic {
    constructor (config) {
         /**
          * The private axios instance that will be used throughout the class
          * @name APIMedic#axios
          * @type Object
          * @default null
          */
        this.axios = null;
         /**
          * APIMedics API token, this is required in order to send requests successfully
          * @name APIMedic#token
          * @type String
          * @default ''
          */
        this.token = '';
        
        if (!config.token || config.token === '') {
            throw Error('We need a token to communicate with the server :(');
        }
        // attach all our props to this
        for(let config_item in config) {
            if (this.hasOwnProperty(config_item)) {
                this[config_item] = config[config_item];
            }
        }
        // create an axios instance that will be used throughout the class
        this.axios = axios.create({
            baseURL: api_config.prod_base_url,
            timeout: 5000,
            headers: {
                'Accept': 'application/json text/plain'
            },
            params: {
                token: config.token,
                language: 'en-gb',
                // format: 'json'
            }
        });
    }
    /**
     * Returns a full list of symptoms
     * @returns {Promise<Object>}
    */
    get_symptoms () {
        const { url_endpoints: { load_symptoms } } = api_config;
        return this.axios.get(load_symptoms)
            .then(response => response.data)
            .catch(response => {
                console.log('[post err] failed to get symptoms', response);
                return response.data;
            });
    }
      /**
     * Returns a full list of body locations
     * @returns {Promise<Object>}
    */
    get_locations () {
        const { url_endpoints: { load_body_locations } } = api_config;
        return this.axios.get(load_body_locations)
            .then(response => response.data)
            .catch(response => {
                console.log('[post err] failed to get locations', response);
                return response.data;
            });
    }
     /**
     * Returns a full list of issues
     * @returns {Promise<Object>}
    */
    get_issues () {
        const { url_endpoints: { load_issues } } = api_config;
        return this.axios.get(load_issues)
            .then(response => response.data)
            .catch(response => {
                console.log('[post err] failed to get symptoms', response.data);
                return response.data;
            });
    }
}

exports.APIMedic = APIMedic;