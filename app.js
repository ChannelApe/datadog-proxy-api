const express = require('express');
const multer = require('multer');
const querystring = require('querystring');
const axios = require('axios');
const winston = require('winston');
const cors = require('cors');


// Initialize Express app
const app = express();


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
  const contentType = req.headers['content-type'];
  logger.info(`Received content type: ${contentType}`);

  if (contentType && contentType.includes('multipart/form-data')) {
    logger.info('Handling multipart/form-data');
    upload.any()(req, res, (err) => {
      if (err) {
        logger.error('Multer error:', err);
        return res.status(500).send('Error processing multipart/form-data');
      }
      // Continue processing the request with multer-parsed data
      handleRequest(req, res);
    });
  } else {
    // Handle other content types (like text/plain)
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.body = data; // Set the raw data to req.body
      handleRequest(req, res);
    });
  }
});

// Com`mo`n request handling logic
function handleRequest(req, res) {
  const forwardPath = decodeURIComponent(req.query.ddforward);
  const queryParams = {...req.query};
  delete queryParams.ddforward;
  const baseUrl = process.env.BASE_URL || "https://browser-intake-datadoghq.com";


  const fullUrl = `${baseUrl}${forwardPath}?${querystring.stringify(queryParams)}`;
  logger.info(`Forwarding to URL: ${fullUrl}`);
  
  if (req.files) {
    logger.info(`Files: ${req.files.map(file => file.originalname).join(", ")}`);
  }else{
    logger.info(`Body: ${req.body}`);
  }

  axios.post(fullUrl, req.body, {
    headers: {
      'Content-Type': req.headers['content-type'], // Forward the original Content-Type
      'X-Forwarded-For': req.headers['x-forwarded-for'],
    },
  }).then(response => {
    logger.info('Response data:', { data: response.data });
    res.status(response.status).send(response.data);
  }).catch(error => {
    logger.error('Error occurred', { error: error.message, stack: error.stack });
    res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
  });
}

module.exports = app;