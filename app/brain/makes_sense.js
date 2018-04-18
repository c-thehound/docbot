const pos = require('pos');
const sortBy = require('lodash/sortBy');
const { get_classifications } = require('./classify_text');
/**
 * Decides if a sentence makes sense or not
 * @param {string} sentence - a sentence or many sentences
 * @author Pozy
*/
module.exports = async (sentence) => {
    const classifications= await get_classifications(sentence);
    const ordered = sortBy(classifications, ['value']);
    /**
     * The strategy here is find the difference between all the values
     * of the confidence scores and see if the gap is not wide
     * enougth for all the differences "< 1"
     * A good sentense has varying gaps between the scores and will
     * therefore pass this test
     * if a majority of these differences is less than 1
     * then we didn't understand the user's sentence
     * This may not be accurate 100% of the time but it lets me weed
     * out useless texts at least
    */
    let counter = 0;
    let diff = [];
    for (let i = 0; i < ordered.length; i++) {
        if (ordered[i + 1]) {
            let j = ordered[i + 1].value - ordered[i].value;
            if (parseInt(j, 10) < 1) counter++;
        }
    }

    return parseInt(
        // this is just a percentage calculation
        (counter / ordered.length) * 100,
        10
    ) < 80;
}
