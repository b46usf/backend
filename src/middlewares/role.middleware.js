const { ForbiddenError } = require('../shared/errors');

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('Authentication context is missing'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError('You do not have permission to access this resource'));
  }

  return next();
};

module.exports = {
  authorize,
};
