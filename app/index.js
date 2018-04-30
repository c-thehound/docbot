const express = require('express');
const tokens = require('./tokens');
const source_model = require('./models/sources')
const api_medic_model = require('./models/apimedic');
const wikipedia_model = require('./models/wikipedia');
const brain = require('./brain/brain');
const slimbot = require('slimbot');

const wiki = new wikipedia_model();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/pdf', express.static(__dirname + '/tmp'));

module.exports = (config) => {
    const port = process.env.PORT || config.PORT;
    const telegram_bot = new slimbot(config.TELEGRAM_ACCESS_TOKEN);
    // register telegram listeners
    telegram_bot.on('message', message => {
        // pass in the slimbot object to this
        const payload = Object.assign({}, message, { telegram_bot });
        brain.process_input(payload);
    });

    telegram_bot.on('callback_query', async (query) => {
        console.log('[telegram] callback');
        const { from, data } = query;
        const payload = Object.assign({}, { from, text: '' }, { postback: data, telegram_bot });
        brain.process_input(payload);
    });

    // facebook webhook
    app.post('/webhook', (req, res) => {

        let body = req.body;

        // Checks this is an event from a page subscription
        if (body.object === 'page') {

            // Iterates over each entry - there may be multiple if batched
            body.entry.forEach(function (entry) {

                // Gets the message. entry.messaging is an array, but 
                // will only ever contain one message, so we get index 0
                let webhook_event = entry.messaging[0];
                brain.process_input(webhook_event);
            });

            // Returns a '200 OK' response to all requests
            res.status(200).send('EVENT_RECEIVED');
        } else {
            // Returns a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }

    });

    // Adds support for GET requests to our webhook
    app.get('/webhook', (req, res) => {
        let VERIFY_TOKEN = config.FB_VERIFY_TOKEN;

        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        // Checks if a token and mode is in the query string of the request
        if (mode && token) {

            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {

                // Responds with the challenge token from the request
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);

            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403);
            }
        }
    });

    // app.post('/webhook', (req, res) => {
    //     brain.process_input(req, res).then(data => res.send(data));
    // });

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

    // production server is - https://still-depths-76007.herokuapp.com/webhook
    // local server is -  http://localhost:3124/webhook
    // for telegram just npm start and search for @virtual_doc_bot on the app
    telegram_bot.startPolling();
    app.listen(port, () => {
        console.log(`App started on port ${port} in ${process.env.PORT ? 'production' : 'development'} mode`);
    });
}