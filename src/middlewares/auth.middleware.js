const asyncHandler = require('../shared/asyncHandler');
const { DEFAULT_SCHOOL_ID } = require('../config/constants');
const { UnauthorizedError } = require('../shared/errors');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const token = authorizationHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  req.user = {
    id: Number(decoded.sub),
    schoolId: Number(decoded.school_id || DEFAULT_SCHOOL_ID),
    email: decoded.email,
    role: decoded.role,
  };

  next();
});

module.exports = {
  authenticate,
};
