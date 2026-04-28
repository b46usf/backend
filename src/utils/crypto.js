const crypto = require('node:crypto');
const env = require('../config/env');

const TEXT_PREFIX = 'enc:v1:';
const JSON_PREFIX = 'enc:json:v1:';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

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

const encryptJson = (payload) => `${JSON_PREFIX}${encrypt(JSON.stringify(payload))}`;

const decryptJson = (encryptedPayload = '') => {
  const value = String(encryptedPayload);

  if (!value.startsWith(JSON_PREFIX)) {
    return JSON.parse(value);
  }

  return JSON.parse(decryptWithFallback(value.slice(JSON_PREFIX.length)));
};

module.exports = {
  decryptJson,
  decryptText,
  encryptJson,
  encryptText,
  encryptTextVariants,
};
