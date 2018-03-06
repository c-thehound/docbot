const natural = require('natural');
const symptoms = require('./symptoms');
const greetings = require('./greetings');
const diseases = require('../entities/index');

const classifier = new natural.BayesClassifier();

const trainers = [].concat(
    greetings,
    symptoms,
);
/**
 * Trains general intents like symptoms and greetings
 */
for (let training in trainers) {
    const { intent, expressions } = trainers[training];
    // add expressions to the classifier
    for (let expression in expressions) {
        classifier.addDocument(expressions[expression], intent);
    }
}

// train specific diseasess
for (let disease in diseases) {
    const illness = diseases[disease];
    const { symptoms, keywords, name } = illness;
    classifier.addDocument(keywords, name);
    //
    for (let symptom in symptoms) {
        const { description, keywords, samples } = symptoms[symptom];
        classifier.addDocument(description, name);
        keywords.map(keyword => {
            classifier.addDocument(keyword, name);
        });
        // user input training
        if (samples) {
            samples.map(sample => {
                classifier.addDocument(sample, name);
            });
        }
    }
}

classifier.train();
natural.PorterStemmer.attach();
const s = 'memories dont die';
let token = s.tokenizeAndStem();
console.log(classifier.getClassifications(token.join(',')));
// save the classifier for future use
// classifier.save('classifiers/greetings.json', (err, classifier) => {
//     if (err) {
//        throw err;
//     }
// }); 