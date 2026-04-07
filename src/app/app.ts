import Fastify from 'fastify';

import { registerHealthRoutes } from '../modules/health/health.routes';

export const buildApp = () => {
  const app = Fastify({ logger: true });

  registerHealthRoutes(app);

  return app;
};
