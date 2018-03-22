const classifier_model = require('../models/classifier');
const natural = require('natural');
/**
 * Use Naive Bayes algorithm to classify text
 * @param {string} text - the text to classify
 */
async function get_classifications (text) {
    const classifier = await classifier_model.load_classifier('classifier_name', 'symptom_greeting');
    const nlp = natural.BayesClassifier.restore(JSON.parse(classifier.classifier_text));
    return nlp.getClassifications(text);
}

async function classify_text (text) {
    const classifier = await classifier_model.load_classifier('classifier_name', 'symptom_greeting');
    const nlp = natural.BayesClassifier.restore(JSON.parse(classifier.classifier_text));
    return nlp.classify(text);
}

/**
 * Check if two strings are closely matched to each other
 * @param {string} a first string
 * @param {string} b last string
 */
function close_enough (a, b) {
    return natural.JaroWinklerDistance(a, b) > 0.8;
}

module.exports = {
    classify_text,
    get_classifications,
    close_enough
}