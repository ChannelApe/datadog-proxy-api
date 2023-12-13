const express = require('express');
const multer = require('multer');
const querystring = require('querystring');
const axios = require('axios');
const winston = require('winston');
const cors = require('cors');
const FormData = require('form-data');

// Initialize Express app
const app = express();

// Define the hostname
const ddhostname = process.env.ddhostname || "browser-intake-datadoghq.com";


app.use(cors())


// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => JSON.stringify({ 
      level: info.level, 
      message: info.message, 
      timestamp: info.timestamp 
    }))
  ),
  transports: [
    new winston.transports.Console()
  ]
});



// Configure Multer (adjust storage and limits as needed)
const upload = multer();

app.get('/health', (_, res) => res.sendStatus(200));

// The main POST route
app.post('/', (req, res) => {
  const forwardPath = decodeURIComponent(req.query.ddforward);
  const queryParams = {...req.query};
  delete queryParams.ddforward;
  const baseUrl = `https://${ddhostname}`;

  const fullUrl = `${baseUrl}${forwardPath}?${querystring.stringify(queryParams)}`;

  axios.post(fullUrl, req, {
    headers: {
      ...req.headers,
      'host': ddhostname,
    },
  })
  .then(response => {
    res.status(response.status).send(response.data);
  })
  .catch(error => {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseBody: error.response?.data
    };
    logger.error('Error occurred', errorDetails);
  
    res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
  });
});


module.exports = app;