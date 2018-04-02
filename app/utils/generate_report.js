const template = require('lodash/template');
const forEach = require('lodash/forEach');
const pdf = require('html-pdf');
const diagnosis_model = require('../models/diagnosis');

const css =
`
    h1 {
        font-size: 26px;
        font-weight: 600
    }

    table{
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        overflow: hidden;
    }
        
    td, th{
        border-top: 1px solid #ECF0F1;
        padding: 10px;
    }
    
    td{
        border-left: 1px solid #ECF0F1;
        border-right: 1px solid #ECF0F1;
    }
    
    th{
        background-color: #4ECDC4;
    }
    
    tr:nth-of-type(even) td{
        background-color: lighten(#4ECDC4, 35%);
    }
`;


const options = {
    format: 'A4'
}

/**
 * Generates a pdf report of a user's previous illnesses
 * @param {string | number} user_id the user's unique id
 */
module.exports = (user_id) => {
    return new Promise (async (good, bad) => {
        const data = await diagnosis_model.load_diagnosis('user_id', user_id, ['*']);

        if (data.length === 0) bad('no_data');

        const details = data.map(datum => {
            const diagnosis = JSON.parse(datum.diagnosis);
            const { illness, answers, info } = diagnosis;
            const symptoms = answers.map(ans => {
                if (ans.score > 0) {
                    return ans.question;
                }
            });

            const all = symptoms.join(',');
            return {
                illness,
                info,
                answers: all
            }
        });

        const templ =
        `
            <table>
            <tr>
                    <th> Illness </th>
                    <th> Description </th>
                    <th> Positive Symptoms </th>
            </tr>
                <% details.map((detail) => { %>
                    <tr>
                        <td><%- detail.illness %></td>
                        <td><%- detail.info %></td>
                        <td><%- detail.answers %></td>
                    </tr>
                <% }); %>
            </table>
        `;

        const compiled = template(templ)({ details });

        const default_template =
        `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                ${css}
                </style>
            </head>
            <body>
                ${compiled}
            </body>
            </html>
        `;

        const doc = pdf.create(default_template, options);
        const file_name = `${user_id}-${new Date().getTime()}.pdf`;
        doc.toFile('tmp/' + file_name, (err, res) => {
            if (err) bad(err);
            good(file_name);
        })
    });
}