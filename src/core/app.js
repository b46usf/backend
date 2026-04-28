const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const env = require('../config/env');
const openApiSpec = require('../config/swagger');
const { errorHandler, notFoundHandler } = require('../middlewares/error.middleware');
const { sendSuccess } = require('../shared/response');
const { httpLogger } = require('../utils/logger');
const apiRouter = require('./router');

const app = express();

const allowedOrigins = env.CLIENT_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(httpLogger);
app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) =>
  sendSuccess(res, {
    message: 'Service healthy',
    data: {
      name: env.APP_NAME,
      environment: env.NODE_ENV,
    },
  }),
);

app.use(env.API_PREFIX, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
