const express = require('express');
const bodyparser = require('body-parser');
const config = require('./config');

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