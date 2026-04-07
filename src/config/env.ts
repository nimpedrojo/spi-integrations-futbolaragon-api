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

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port,
  futbolAragonPublicBaseUrl: process.env.FUTBOL_ARAGON_PUBLIC_BASE_URL ?? '',
  futbolAragonAuthBaseUrl: process.env.FUTBOL_ARAGON_AUTH_BASE_URL ?? '',
  futbolAragonUsername: process.env.FUTBOL_ARAGON_USERNAME ?? '',
  futbolAragonPassword: process.env.FUTBOL_ARAGON_PASSWORD ?? '',
} as const;
