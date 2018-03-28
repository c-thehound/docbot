/**
 * Database configurations
 * I use knex for its awesome querybuilder
 * @author pozy<masikapolycarp@gmail.com>
 */
const url = require('url');

if (process.env.NODE_ENV === 'production') {
    const config = url.parse(process.env.CLEARDB_DATABASE_URL);
    const [ user, password ] = config.path.split(':');
    const db_settings = {
        client: 'mysql',
        connection: {
            host: config.host,
            user: user,
            password: password,
            database: config.pathname.slice(1)
        }
    };
    console.log(db_settings);
    module.exports = require('knex')(db_settings);
} else {
    module.exports = require('knex')({
        client: 'mysql',
        connection: {
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'docbot'
        }
    });
}