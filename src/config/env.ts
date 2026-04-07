// Loads and validates the minimum environment required by the service.
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['PORT', 'NODE_ENV'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const port = Number(process.env.PORT);
const fafTimeoutMs = Number(process.env.FAF_TIMEOUT_MS ?? 10000);
const fafMaxRetries = Number(process.env.FAF_MAX_RETRIES ?? 2);

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

if (Number.isNaN(fafTimeoutMs) || fafTimeoutMs <= 0) {
  throw new Error('FAF_TIMEOUT_MS must be a valid positive number');
}

if (Number.isNaN(fafMaxRetries) || fafMaxRetries < 0) {
  throw new Error('FAF_MAX_RETRIES must be a valid non-negative number');
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port,
  fafBaseUrl: process.env.FAF_BASE_URL ?? 'https://www.futbolaragon.com',
  fafTimeoutMs,
  fafMaxRetries,
  fafUserAgent: process.env.FAF_USER_AGENT ?? 'spi-integrations-futbolaragon-api/0.1',
  futbolAragonPublicBaseUrl: process.env.FUTBOL_ARAGON_PUBLIC_BASE_URL ?? '',
  futbolAragonAuthBaseUrl: process.env.FUTBOL_ARAGON_AUTH_BASE_URL ?? '',
  futbolAragonUsername: process.env.FUTBOL_ARAGON_USERNAME ?? '',
  futbolAragonPassword: process.env.FUTBOL_ARAGON_PASSWORD ?? '',
} as const;
