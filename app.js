const express = require("express");
const cors = require("cors");
const axios = require("axios");
const querystring = require("querystring");
const winston = require("winston");

const app = express();

app.use(cors());

// Winston logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Ensures single-line JSON output
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Use environment variable for baseUrl, with a default fallback
const baseUrl = process.env.BASE_URL || "https://browser-intake-datadoghq.com";

app.get("/health", (_, res) => res.sendStatus(200));

app.post('/', (req, res) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', async () => {
    // Construct the full URL
    const forwardPath = decodeURIComponent(req.query.ddforward);
    const queryParams = {...req.query};
    delete queryParams.ddforward; // Remove the ddforward parameter.

    const fullUrl = `${baseUrl}${forwardPath}?${querystring.stringify(queryParams)}`;
    logger.info(`Forwarding to URL: ${fullUrl}`);
    logger.info(`Body: ${data}`);

    try {
      const response = await axios.post(
        fullUrl,
        data, // Use the raw data as the body
        {
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            // Include other necessary headers
          },
        }
      );
      logger.info('Response data:', { data: response.data });
      res.status(response.status).send(response.data);
    } catch (error) {
      logger.error('Error occurred', { error: error.message, stack: error.stack });
      res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });
});


module.exports = app;
