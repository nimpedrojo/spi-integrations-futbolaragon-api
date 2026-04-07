import { FastifyInstance } from 'fastify';

export const registerHealthRoutes = (app: FastifyInstance) => {
  app.get('/health', async () => {
    return { status: 'ok' };
  });
};
