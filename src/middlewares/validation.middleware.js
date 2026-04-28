const { ZodError } = require('zod');
const { BadRequestError } = require('../shared/errors');

const validate = (schema = {}) => (req, _res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }

    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }

    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new BadRequestError('Validation failed', error.flatten()));
    }

    return next(error);
  }
};

module.exports = {
  validate,
};
