// Registers transport-level HTTP routes for the service.
import { FastifyInstance } from 'fastify';

import { createSyncTeamJob } from '../modules/futbolAragon/jobs/sync-team.job';

const syncTeamJob = createSyncTeamJob();

export const registerRoutes = (app: FastifyInstance) => {
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.post('/jobs/futbol-aragon/sync-team', async () => {
    const result = await syncTeamJob.run({
      clubId: 'club-spike',
      teamId: 'team-spike',
      sourceTeamSlug: 'equipo-spike',
      accessMode: 'public',
    });

    return {
      status: 'accepted',
      syncRunId: result.syncRunId,
      summary: result.summary,
    };
  });
};
