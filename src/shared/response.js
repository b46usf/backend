const env = require('../config/env');
const { encryptJson } = require('../utils/crypto');

const shouldReturnPlainResponse = (res) =>
  env.NODE_ENV !== 'production' && res.req?.headers['x-edusense-plain-response'] === 'true';

const shouldEncrypt = (res, value) =>
  env.API_RESPONSE_ENCRYPTION_ENABLED && !shouldReturnPlainResponse(res) && value !== null && value !== undefined;

const encryptResponseField = (res, value) => (shouldEncrypt(res, value) ? encryptJson(value) : value);

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta } = {}) => {
  const payload = {
    success: true,
    message,
    encrypted: shouldEncrypt(res, data) || shouldEncrypt(res, meta),
    data: encryptResponseField(res, data),
  };

  if (meta) {
    payload.meta = encryptResponseField(res, meta);
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
