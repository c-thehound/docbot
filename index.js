/**
* docbot
* An Intelligent Virtual Doctor built from scratch
 * @author pozy<masikapolycarp@gmail.com>
 */
const express = require('express');
const config = require('./config');
const tokens = require('./app/tokens');
const source_model = require('./app/models/sources')
const api_medic_model = require('./app/models/apimedic');
const wikipedia_model = require('./app/models/wikipedia');
const brain = require('./app/brain/brain');
const wiki = new wikipedia_model();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook', (req, res) => {
    brain.process_input(req, res).then(data => res.send(data));
});
// crawls all our data sources
// use this to test this functionality
app.post('/crawl', (req, res) => {
    brain.crawl()
    .then(responses => {
        res.send(responses);
    });
});

app.post('/question_generator', (req, res) => {
    brain.all_questions().then(data => {
        res.send(data);
    });
});

// use this to tell the app to retrain itself after crawling
app.post('/train', (req, res) => {
    brain.learn_and_train()
        .then(success => {
            res.send({
                success: true,
                message: 'successfully trained the neural net'
            });
        });
});
// use this to recrawl the datasources and save to database
app.post('/crawl_persist', (req, res) => {
    brain.crawl_persist()
        .then(entities => {
            res.send({
                success: true,
                entities
            });
        });
});

// use this endpoint to test the data that wikipedia returns on the
// disease
// fire up POSTMAN or something to test this
app.get('/models/wikipedia/:disease', (req, res) => {
    const disease = req.params.disease;
    wiki.find_condition(disease).then(data => {
        res.send(data);
    }).catch(err => {
        console.log('[error]', err);
        res.send(err);
    });
});

// just tests on apimedic api - remove this when done
// TODO: do i need this anymore?
app.get('/apimedic/issues', (req, res) => {
    tokens.refresh_token().then(lets_do_this => {
        source_model.get_sources('api_name', 'api_medic')
            .then(response => {
                const source = response[0];
                if (source) {
                    // lets try using
                    const medic = new api_medic_model.APIMedic({
                        token: source.token
                    });
                    medic.get_symptoms()
                        .then(symptoms => {
                            res.send(symptoms);
                        })
                        .catch(err => res.send(err));
                }
            })
    });
});


app.listen(config.PORT, () => console.log(`App started on port ${config.PORT}`));