const pino = require('pino');
const pinoHttp = require('pino-http');
const env = require('../config/env');

const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'res.headers["set-cookie"]'],
});

const httpLogger = pinoHttp({
  logger,
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed with ${res.statusCode}`;
  },
});

module.exports = {
  httpLogger,
  logger,
};
