const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  loginRateLimiter,
};
