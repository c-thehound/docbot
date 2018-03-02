/**
 * Database configurations
 * I use knex for its awesome querybuilder
 * @author pozy<masikapolycarp@gmail.com>
 */
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'docbot'
    }
});

module.exports = knex;