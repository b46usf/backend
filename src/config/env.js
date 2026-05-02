const path = require('node:path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const booleanFromEnv = (defaultValue) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (typeof value === 'boolean') {
        return value;
      }

      return String(value).trim().toLowerCase() === 'true';
    }, z.boolean())
    .default(defaultValue);

const RESPONSE_CRYPTO_FALLBACK_SECRET = 'edusense-response-encryption-v1';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('EduSense AI Backend'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must contain at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  GOOGLE_CLIENT_ID: z.string().default(''),
  CRYPTO_SECRET: z.string().default(''),
  CRYPTO_ALGORITHM: z.enum(['aes-256-cbc']).default('aes-256-cbc'),
  CRYPTO_KEY: z.string().default(''),
  CRYPTO_IV: z.string().default(''),
  API_RESPONSE_ENCRYPTION_ENABLED: booleanFromEnv(true),
  API_RESPONSE_CRYPTO_SECRET: z.string().default(RESPONSE_CRYPTO_FALLBACK_SECRET),
  API_RESPONSE_CRYPTO_KEY: z.string().default(''),
  API_RESPONSE_CRYPTO_IV: z.string().default(''),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('edusense_ai'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  LOG_LEVEL: z.string().default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Invalid environment configuration: ${issues}`);
}

module.exports = Object.freeze(parsedEnv.data);
