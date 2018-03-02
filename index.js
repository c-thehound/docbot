/**
 * @author pozy<masikapolycarp@gmail.com>
 */
const express = require('express');
const bodyparser = require('body-parser');
const config = require('./config');
const tokens = require('./app/tokens');
const source_model = require('./app/models/sources')
const api_medic_model = require('./app/models/apimedic');

const app = express();
app.use(bodyparser.json());

app.post('/', (req, res) => {
    res.send({
        replies: [{
            type: 'text',
            content: "Let's get it started!",
        }],
        conversation: {
            memory: { key: 'value' }
        }
    });
})
// just example route of getting tokens - remove this when done please
app.get('/get_token/:token_id', (req, res) => {
    const id = req.params.token_id;
    source_model.get_sources('id', id)
        .then(token => {
            res.send(token[0]);
        });
});

app.get('/token_refresh', (req, res) => {
    tokens.refresh_token()
        .then(refreshed => res.send(refreshed));
})
// example route genrating tokens - remove this after testing
app.post('/token', (req, res) => {
    const ep = 'https://sandbox-authservice.priaid.ch/login';
    get_token.loadToken(
        'masikapolycarp@gmail.com',
        'Pm8q5L3Egw9K4Ayr7',
        ep
    )
    .then(response => {
        source_model.insert_source(ep, '', response.Token, response.ValidThrough, 'api_medic')
        .then((resp) => {
            res.send({
                success: true,
                message: 'successfully saved tokens',
                debug: resp
            });
        })
        .catch(resp => {
            console.log('[error]', resp);
            res.send(resp);
        });
    }).catch(response => {
        res.send(response);
    })
});

// just tests - remove this when done
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

app.post('/errors', (req, res) => {
    // do something with the error here
    console.error('[POST] Error', req.body);
    res.send({
        replies: [{
            type: 'text',
            content: 'Something is very wrong!',
        }]
    })
});

app.listen(config.PORT, () => console.log(`App started on port ${config.PORT}`));