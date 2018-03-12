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