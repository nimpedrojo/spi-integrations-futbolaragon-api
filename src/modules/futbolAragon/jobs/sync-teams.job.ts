// Exposes a sequential multi-team sync as a repeatable batch job entry point.
import { logger } from '../../../shared/logger/logger';
import { SyncBatchRunRepository } from '../repositories/sync-batch-run.repository';
import { SourceReferenceRepository } from '../repositories/source-reference.repository';
import { TeamSyncTargetRepository } from '../repositories/team-sync-target.repository';
import { createSyncTeamService } from '../services/sync-team.service';
import { SyncTeamsService } from '../services/sync-teams.service';

export const createSyncTeamsService = () =>
  new SyncTeamsService(
    createSyncTeamService(),
    new TeamSyncTargetRepository(),
    new SourceReferenceRepository(),
    new SyncBatchRunRepository(),
  );

export const runSyncTeamsJobCli = async (): Promise<number> => {
  const service = createSyncTeamsService();

  logger.info('Starting Futbol Aragon multi-team sync job');

  try {
    const result = await service.execute();

    logger.info('Finished Futbol Aragon multi-team sync job', {
      batchRunId: result.batchRunId,
      status: result.status,
      totalTeams: result.totalTeams,
      successCount: result.successCount,
      partialCount: result.partialCount,
      failedCount: result.failedCount,
      results: result.results,
    });

    if (result.totalTeams > 0 && result.status !== 'failed') {
      return 0;
    }

    return 1;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown multi-team batch error';

    logger.error('Futbol Aragon multi-team sync job failed', {
      errorMessage,
    });

    return 1;
  }
};

if (require.main === module) {
  void runSyncTeamsJobCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
