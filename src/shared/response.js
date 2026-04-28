const env = require('../config/env');
const { encryptJson } = require('../utils/crypto');

const shouldEncrypt = (value) => env.API_RESPONSE_ENCRYPTION_ENABLED && value !== null && value !== undefined;

const encryptResponseField = (value) => (shouldEncrypt(value) ? encryptJson(value) : value);

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta } = {}) => {
  const payload = {
    success: true,
    message,
    encrypted: shouldEncrypt(data) || shouldEncrypt(meta),
    data: encryptResponseField(data),
  };

  if (meta) {
    payload.meta = encryptResponseField(meta);
  }

  return res.status(statusCode).json(payload);
};

const sendCreated = (res, message, data = null) =>
  sendSuccess(res, {
    statusCode: 201,
    message,
    data,
  });

module.exports = {
  sendCreated,
  sendSuccess,
};
