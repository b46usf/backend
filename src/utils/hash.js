const bcrypt = require('bcryptjs');
const env = require('../config/env');

const hashPassword = async (plainText) => bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);

const comparePassword = async (plainText, hashedValue) => bcrypt.compare(plainText, hashedValue);

module.exports = {
  comparePassword,
  hashPassword,
};
