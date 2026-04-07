// Boots the Fastify server with the configured host and port.
import { buildServer } from './app/server';
import { env } from './config/env';

const app = buildServer();

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
