/**
* docbot
* An Intelligent Virtual Doctor built from scratch
 * @author pozy<masikapolycarp@gmail.com>
 */
const config = require('./config')();
module.exports = require('./app/index')(config);
