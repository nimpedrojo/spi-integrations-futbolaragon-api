// Exposes the sync orchestration as a repeatable job entry point.
import { logger } from '../../../shared/logger/logger';
import { createSyncTeamService, SyncTeamService } from '../services/sync-team.service';
import { SyncTeamResult, TeamSyncRequest } from '../types/domain.types';

type SyncTeamJobCliOptions = TeamSyncRequest;

export class SyncTeamJob {
  constructor(private readonly syncTeamService: SyncTeamService) {}

  async run(request: TeamSyncRequest): Promise<SyncTeamResult> {
    return this.syncTeamService.execute(request);
  }
}

export const createSyncTeamJob = () => new SyncTeamJob(createSyncTeamService());

const DEFAULT_CLI_OPTIONS: SyncTeamJobCliOptions = {
  clubId: process.env.FAF_SYNC_CLUB_ID ?? 'club-spike',
  teamId: process.env.FAF_SYNC_TEAM_ID ?? 'team-spike',
  sourceTeamSlug: process.env.FAF_SYNC_SOURCE_TEAM_SLUG ?? 'stadium-venecia-a',
  accessMode: 'public',
};

const parseCliOptions = (): SyncTeamJobCliOptions => {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_CLI_OPTIONS };

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (!key?.startsWith('--') || value === undefined) {
      continue;
    }

    switch (key) {
      case '--club-id':
        options.clubId = value;
        break;
      case '--team-id':
        options.teamId = value;
        break;
      case '--source-team-slug':
        options.sourceTeamSlug = value;
        break;
      default:
        break;
    }
  }

  return options;
};

export const runSyncTeamJobCli = async (): Promise<number> => {
  const options = parseCliOptions();
  const job = createSyncTeamJob();

  logger.info('Starting nightly-ready Futbol Aragon sync job', {
    clubId: options.clubId,
    teamId: options.teamId,
    sourceTeamSlug: options.sourceTeamSlug,
    accessMode: options.accessMode,
  });

  try {
    const result = await job.run(options);

    logger.info('Finished nightly-ready Futbol Aragon sync job', {
      syncRunId: result.syncRunId,
      status: result.status,
      summary: result.summary,
      issuesCount: result.issues?.length ?? 0,
      issues: result.issues?.map((issue) => ({
        stage: issue.stage,
        severity: issue.severity,
        message: issue.message,
      })),
    });

    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown job error';

    logger.error('Nightly-ready Futbol Aragon sync job failed', {
      clubId: options.clubId,
      teamId: options.teamId,
      sourceTeamSlug: options.sourceTeamSlug,
      errorMessage,
    });

    return 1;
  }
};

if (require.main === module) {
  void runSyncTeamJobCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
