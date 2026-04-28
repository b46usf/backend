const env = require('../config/env');
const { ApiError, BadRequestError, ConflictError, NotFoundError } = require('../shared/errors');
const { logger } = require('../utils/logger');

const notFoundHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

const mapDatabaseError = (error) => {
  if (error?.code === 'ER_DUP_ENTRY') {
    return new ConflictError('Duplicate value violates a unique constraint');
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return new BadRequestError('Referenced record does not exist');
  }

  return error;
};

const errorHandler = (error, req, res, _next) => {
  const normalizedError = mapDatabaseError(error);

  if (!(normalizedError instanceof ApiError)) {
    logger.error(
      {
        err: normalizedError,
        method: req.method,
        url: req.originalUrl,
      },
      'Unhandled application error',
    );
  }

  const statusCode = normalizedError.statusCode || 500;
  const payload = {
    success: false,
    message: normalizedError.message || 'Internal server error',
    code: normalizedError.code || 'INTERNAL_SERVER_ERROR',
  };

  if (normalizedError.details && env.NODE_ENV !== 'production') {
    payload.details = normalizedError.details;
  }

  if (env.NODE_ENV !== 'production') {
    payload.stack = normalizedError.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
