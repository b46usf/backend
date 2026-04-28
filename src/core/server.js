const http = require('node:http');
const env = require('../config/env');
const { closePool, testConnection } = require('../config/db');
const { logger } = require('../utils/logger');
const app = require('./app');

const DEV_PORT_RETRY_LIMIT = 10;

const canRetryPort = (error, attempt) =>
  env.NODE_ENV === 'development' &&
  error?.code === 'EADDRINUSE' &&
  attempt < DEV_PORT_RETRY_LIMIT;

const startHttpServer = (server, port, attempt = 0) =>
  new Promise((resolve, reject) => {
    const handleListening = () => {
      server.off('error', handleError);
      resolve(port);
    };

    const handleError = (error) => {
      server.off('listening', handleListening);

      if (canRetryPort(error, attempt)) {
        const nextPort = port + 1;

        logger.warn(
          {
            requestedPort: port,
            fallbackPort: nextPort,
            attempt: attempt + 1,
          },
          'Port is already in use, trying the next available development port',
        );

        resolve(startHttpServer(server, nextPort, attempt + 1));
        return;
      }

      reject(error);
    };

    server.once('listening', handleListening);
    server.once('error', handleError);
    server.listen(port);
  });

const bootstrap = async () => {
  try {
    await testConnection();

    const server = http.createServer(app);

    const shutdown = async (signal) => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async (error) => {
        if (error) {
          logger.error({ err: error }, 'HTTP server shutdown failed');
          process.exit(1);
        }

        await closePool();
        logger.info('Database pool closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });

    const activePort = await startHttpServer(server, env.PORT);

    logger.info(
      {
        port: activePort,
        requestedPort: env.PORT,
        apiPrefix: env.API_PREFIX,
        environment: env.NODE_ENV,
      },
      `${env.APP_NAME} listening`,
    );
  } catch (error) {
    await closePool().catch(() => {});
    logger.fatal({ err: error }, 'Application failed to start');
    process.exit(1);
  }
};

void bootstrap();
