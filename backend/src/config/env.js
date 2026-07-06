import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');
const backendRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(backendRoot, '.env'), override: true });

const REQUIRED_KEYS = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'BACKEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_EMBEDDING_MODEL',
  'GEMINI_EMBEDDING_DIMENSION',
  'NVIDIA_NIM_API_KEY',
  'NVIDIA_NIM_BASE_URL',
  'NVIDIA_NIM_MODEL',
  'JWT_SECRET',
  'COOKIE_SECRET'
];

const missingKeys = REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required environment variable${missingKeys.length === 1 ? '' : 's'}: ${missingKeys.join(', ')}`
  );
}

const env = {
  PORT: parsePort('PORT'),
  NODE_ENV: parseEnum('NODE_ENV', ['development', 'test', 'production']),
  FRONTEND_URL: parseUrl('FRONTEND_URL'),
  BACKEND_URL: parseUrl('BACKEND_URL'),
  GOOGLE_CLIENT_ID: getString('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getString('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: parseUrl('GOOGLE_REDIRECT_URI'),
  SUPABASE_URL: parseUrl('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getString('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: getString('SUPABASE_ANON_KEY'),
  GEMINI_API_KEY: getString('GEMINI_API_KEY'),
  GEMINI_MODEL: getString('GEMINI_MODEL'),
  GEMINI_EMBEDDING_MODEL: getString('GEMINI_EMBEDDING_MODEL'),
  GEMINI_EMBEDDING_DIMENSION: parseEmbeddingDimension('GEMINI_EMBEDDING_DIMENSION'),
  NVIDIA_NIM_API_KEY: getString('NVIDIA_NIM_API_KEY'),
  NVIDIA_NIM_BASE_URL: parseUrl('NVIDIA_NIM_BASE_URL'),
  NVIDIA_NIM_MODEL: getString('NVIDIA_NIM_MODEL'),
  JWT_SECRET: parseSecret('JWT_SECRET'),
  COOKIE_SECRET: parseSecret('COOKIE_SECRET')
};

validateGoogleRedirectUri(env);

function getString(key) {
  return process.env[key].trim();
}

function parsePort(key) {
  const value = Number.parseInt(getString(key), 10);

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${key} must be a valid TCP port between 1 and 65535`);
  }

  return value;
}

function parseEnum(key, allowedValues) {
  const value = getString(key);

  if (!allowedValues.includes(value)) {
    throw new Error(`${key} must be one of: ${allowedValues.join(', ')}`);
  }

  return value;
}

function parseUrl(key) {
  const value = getString(key);

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
}

function parseEmbeddingDimension(key) {
  const value = Number.parseInt(getString(key), 10);

  if (value !== 768) {
    throw new Error(`${key} must be 768 for this MVP schema`);
  }

  return value;
}

function parseSecret(key) {
  const value = getString(key);

  if (value.length < 32) {
    throw new Error(`${key} must be at least 32 characters`);
  }

  return value;
}

function validateGoogleRedirectUri(config) {
  const expectedRedirectUri = new URL('/auth/google/callback', config.BACKEND_URL).toString().replace(/\/$/, '');

  if (config.GOOGLE_REDIRECT_URI !== expectedRedirectUri) {
    throw new Error(
      `GOOGLE_REDIRECT_URI must be ${expectedRedirectUri} so OAuth state is created and consumed by the same backend`
    );
  }
}

export { REQUIRED_KEYS };
export default env;
