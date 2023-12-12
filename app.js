const express = require('express');
const cors = require('cors');
const axios = require("axios");

const app = express();

app.use(cors())

app.get('/health', (_, res) => res.sendStatus(200));

app.post('/', async (req, res) => {
  await axios.post(
    req.query.ddforward,
    req.body,
    {
      headers: {
        Accept: req.headers.accept,
        'Content-Type': req.headers['content-type'],
        'X-Forwarded-For': req.headers['x-forwarded-for'],
      },
    }
  ).then(function (response) {
    console.log(response?.data);
  }).catch(function (error) {
    console.error(error);
    console.error(JSON.stringify(error.response?.data));
  });

  return res.sendStatus(200);
});

module.exports = app;
