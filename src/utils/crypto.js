const crypto = require('node:crypto');
const env = require('../config/env');

const TEXT_PREFIX = 'enc:v1:';
const JSON_PREFIX = 'enc:json:v1:';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const RESPONSE_CRYPTO_FALLBACK_SECRET = 'edusense-response-encryption-v1';

const normalizeKey = (value) => crypto.createHash('sha256').update(value).digest().subarray(0, KEY_LENGTH);
const normalizeIv = (value) => crypto.createHash('sha256').update(value).digest().subarray(0, IV_LENGTH);

const activeSecret = env.CRYPTO_SECRET || env.JWT_SECRET;
const activeConfig = {
  algorithm: env.CRYPTO_ALGORITHM,
  key: normalizeKey(env.CRYPTO_KEY || activeSecret),
  iv: normalizeIv(env.CRYPTO_IV || `${activeSecret}:iv`),
};

const legacyConfig = {
  algorithm: 'aes-256-cbc',
  key: normalizeKey(activeSecret),
  iv: normalizeIv(`${activeSecret}:iv`),
};

const responseSecret = env.API_RESPONSE_CRYPTO_SECRET || RESPONSE_CRYPTO_FALLBACK_SECRET;
const responseConfig = {
  algorithm: env.CRYPTO_ALGORITHM,
  key: normalizeKey(env.API_RESPONSE_CRYPTO_KEY || responseSecret),
  iv: normalizeIv(env.API_RESPONSE_CRYPTO_IV || `${responseSecret}:iv`),
};

const encrypt = (plainText, config = activeConfig) => {
  const cipher = crypto.createCipheriv(config.algorithm, config.key, config.iv);
  return Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]).toString('base64');
};

const decrypt = (encryptedText, config = activeConfig) => {
  const decipher = crypto.createDecipheriv(config.algorithm, config.key, config.iv);
  return Buffer.concat([decipher.update(String(encryptedText), 'base64'), decipher.final()]).toString('utf8');
};

const decryptWithFallback = (encryptedText) => {
  try {
    return decrypt(encryptedText, activeConfig);
  } catch (error) {
    return decrypt(encryptedText, legacyConfig);
  }
};

const encryptText = (plainText = '') => {
  return `${TEXT_PREFIX}${encrypt(plainText)}`;
};

const encryptTextVariants = (plainText = '') =>
  [...new Set([encryptText(plainText), `${TEXT_PREFIX}${encrypt(plainText, legacyConfig)}`, String(plainText)])];

const decryptText = (encryptedText = '') => {
  const value = String(encryptedText);

  if (!value.startsWith(TEXT_PREFIX)) {
    return value;
  }

  return decryptWithFallback(value.slice(TEXT_PREFIX.length));
};

const encryptJson = (payload, config = activeConfig) => `${JSON_PREFIX}${encrypt(JSON.stringify(payload), config)}`;

const decryptJson = (encryptedPayload = '', config = activeConfig) => {
  const value = String(encryptedPayload);

  if (!value.startsWith(JSON_PREFIX)) {
    return JSON.parse(value);
  }

  try {
    return JSON.parse(decrypt(value.slice(JSON_PREFIX.length), config));
  } catch (error) {
    if (config !== activeConfig) {
      throw error;
    }

    return JSON.parse(decryptWithFallback(value.slice(JSON_PREFIX.length)));
  }
};

const encryptResponseJson = (payload) => encryptJson(payload, responseConfig);

const decryptResponseJson = (encryptedPayload = '') => decryptJson(encryptedPayload, responseConfig);

module.exports = {
  decryptJson,
  decryptResponseJson,
  decryptText,
  encryptJson,
  encryptResponseJson,
  encryptText,
  encryptTextVariants,
};
