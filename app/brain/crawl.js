const Wikipedia = require('../models/wikipedia');
const diseases = require('../utils/supported_illnesses');
const wiki_bot = new Wikipedia();
/**
 * Fetch disease data fro wikipedia
*/
const crawl = () => {
    const promises = [];
    for (let d in diseases) {
        const disease = diseases[d];
        promises.push(
            wiki_bot.find_condition(disease)
        );
    }
    return Promise.all(promises);
}

module.exports = crawl;