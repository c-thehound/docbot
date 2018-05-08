/**
 * A naive sentence generator
 * This question generator will be changing severally as more data is fed into it
 * @param {Array} symptoms - an array of 'confused' symptoms - this is just
 * made up of text like 'pain in the belly'
 * @returns {Array[string]} this should return a list of valid questions like ['do you have pain in the belly?']
 * @author pozy <masikapolycarp@gmail.com>
 */
const pos = require('pos');
const _ = require('lodash');
// use this to know which words represent which tags
const key_tags = {
    adjective: 'JJ',
    noun: 'NN',
    verb: 'VBG',
    plural_noun: 'NNS',
    vowel_noun: 'JJ_V'
}

const vowels = 'aeiou';
// a random question will be taken from any of the ones below
// if the first word in the sentence matches the tags
const samples = {
    'JJ': [
        'do you have a',
        'are you experiencing a',
        'so you have a',
        'just a check, do you have a',
        'any'
    ],
    'JJ_V': [
        'do you have an',
        'are you experiencing an',
        'so you have an',
        'just a check, do you have an',
        'any'
    ],
    // JJ but pluralized
    'NNS': [
        'do you have',
        'so you have',
        'just a check, do you have',
        'any'
    ],
    'VBG': [
        'are you',
        'have you been',
        'any'
    ]
};

const filler_words = [
    'None'
];

module.exports = (symptoms = []) => {
    const questions = [];
    for(let s in symptoms) {
        const symptom = symptoms[s];
        // some sentences justr return 'None', don't bother generating questions
        if (
            _.filter(
                filler_words, w => _.lowerCase(w) === _.lowerCase(symptom)
            ).length < 1
        ) {
            // to know how to questionize the sentence, we need to
            // get the first word first
            let symptom_list = symptom.split(' ');
            const first_word = _.lowerCase(symptom_list[0]);
            // take the rest of the words
            const rest_words = _.lowerCase(symptom_list.slice(1).join(' ')); // is there a better way to do this?

            // classify the word
            const words = new pos.Lexer().lex(first_word);
            const tagged = new pos.Tagger().tag(words);
            const [tagged_word] = tagged;
            let [word, tag] = tagged_word;
            // the chosen sample question
            let sample_q = '';
            switch(tag) {
                case key_tags.noun:
                case key_tags.adjective:
                    // get the rest f the sentence and check if its in plural form
                    const rest = new pos.Lexer().lex(rest_words);
                    const rest_tagged = new pos.Tagger().tag(rest);
                    // the sample array will be selected depending on the pluralization/singularity
                    // of the rest of the sentence
                    let sample = samples.JJ;
                    for (let group in rest_tagged) {
                        //    [word, tag]
                        const [w, t] = rest_tagged[group];
                        if (t === key_tags.plural_noun) {
                            sample = samples.NNS;
                        }
                    }
                    // for words that start with a vowel, don't precede with a
                    // 'a abdominal pain' ==> 'an abdominal pain
                    if (vowels.indexOf(word[0])  !== -1) {
                        sample = samples.JJ_V;
                    }
                    
                    if (
                        word.endsWith('ion') || // 'confusion'
                        word.endsWith('ness') // 'clumsiness'
                    ) {
                        sample = samples.NNS;
                    }
                    sample_q = _.sample(sample);
                    break;
                case key_tags.verb:
                    if (word.endsWith('ing')) {
                        // this is a gerund
                        sample_q = _.sample(samples.VBG);
                    }
                    break;
                case key_tags.plural_noun:
                    sample_q = _.sample(samples.NNS);
                    break;
                default:
                    break;
            };
            // the full question in all its glory
            const question = _.upperFirst(`${sample_q.trim()} ${word.toLocaleLowerCase().trim()} ${rest_words.trim() || ''}?`);
            questions.push(question);
        }
    }
    return questions;
};