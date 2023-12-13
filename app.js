const express = require('express');
const cors = require('cors');
const axios = require("axios");
const querystring = require('querystring');

const app = express();

app.use(cors());
app.use(express.json());

// Use environment variable for baseUrl, with a default fallback
const baseUrl = process.env.BASE_URL || 'https://browser-intake-datadoghq.com';

app.get('/health', (_, res) => res.sendStatus(200));

app.post('/', async (req, res) => {
  const forwardPath = decodeURIComponent(req.query.ddforward);

  if (!forwardPath) {
    console.error('No ddforward parameter provided or it is invalid');
    return res.status(400).send('No ddforward parameter provided or it is invalid');
  }

  const queryParams = {...req.query};
  delete queryParams.ddforward; // Remove the ddforward parameter.

  const fullUrl = `${baseUrl}${forwardPath}?${querystring.stringify(queryParams)}`;
  console.log('Forwarding to URL:', fullUrl); // Log the URL for debugging

  try {
    const response = await axios.post(
      fullUrl,
      req.body,
      {
        headers: {
          Accept: req.headers.accept,
          'Content-Type': req.headers['content-type'],
          'X-Forwarded-For': req.headers['x-forwarded-for'],
        },
      }
    );
    console.log('Response data:', response.data);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
  }
});

module.exports = app;
