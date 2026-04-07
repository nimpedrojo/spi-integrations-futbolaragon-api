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
} as const;
