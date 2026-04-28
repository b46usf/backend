const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { decryptText } = require('./crypto');

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      school_id: user.school_id,
      email: decryptText(user.email),
      role: user.role_name || user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
