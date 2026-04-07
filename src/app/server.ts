// Creates the Fastify server and wires the application routes.
import Fastify from 'fastify';

import { registerRoutes } from './routes';

export const buildServer = () => {
  const app = Fastify({ logger: true });

  registerRoutes(app);

  return app;
};
