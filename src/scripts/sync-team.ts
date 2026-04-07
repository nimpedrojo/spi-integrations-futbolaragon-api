// Runs the first manual end-to-end team sync for the Futbol Aragon spike.
import { logger } from '../shared/logger/logger';
import { createSyncTeamJob } from '../modules/futbolAragon/jobs/sync-team.job';
import { TeamSourceMapper } from '../modules/futbolAragon/mappers/team-source.mapper';
import { SourceReferenceRepository } from '../modules/futbolAragon/repositories/source-reference.repository';

type CliOptions = {
  clubId: string;
  teamId: string;
  sourceTeamSlug: string;
  internalTeamName: string;
  sourceTeamId?: string;
  sourceTeamName: string;
  sourceClubName?: string;
  sourceUrl?: string;
};

const DEFAULT_OPTIONS: CliOptions = {
  clubId: 'club-spike',
  teamId: 'team-spike',
  sourceTeamSlug: 'stadium-venecia-a',
  internalTeamName: 'Stadium Venecia A',
  sourceTeamId: '2208411',
  sourceTeamName: 'STADIUM VENECIA-A.D. "A"',
  sourceClubName: 'STADIUM VENECIA-A.D.',
  sourceUrl: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisEquipos?cod_primaria=1000119&Codigo_Equipo=2208411',
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

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
      case '--internal-team-name':
        options.internalTeamName = value;
        break;
      case '--source-team-id':
        options.sourceTeamId = value;
        break;
      case '--source-team-name':
        options.sourceTeamName = value;
        break;
      case '--source-club-name':
        options.sourceClubName = value;
        break;
      case '--source-url':
        options.sourceUrl = value;
        break;
      default:
        break;
    }
  }

  return options;
};

const ensureTeamReference = async (options: CliOptions) => {
  const repository = new SourceReferenceRepository();
  const mapper = new TeamSourceMapper();
  const existingReferences = await repository.findByInternalId(options.teamId, 'team');

  if (existingReferences.length > 0) {
    logger.info('Using existing team source reference', {
      internalTeamId: options.teamId,
      referenceCount: existingReferences.length,
    });

    return existingReferences[0];
  }

  const mapping = mapper.buildIdentityMapping({
    internalTeamId: options.teamId,
    internalTeamName: options.internalTeamName,
    sourceTeamId: options.sourceTeamId,
    sourceTeamName: options.sourceTeamName,
    sourceClubName: options.sourceClubName,
    sourceUrl: options.sourceUrl,
    sourceTeamSlug: options.sourceTeamSlug,
  });
  const sourceReference = mapper.toTeamSourceReference(mapping);
  const savedReference = await repository.save(sourceReference);

  logger.info('Created team source reference for manual sync', {
    internalTeamId: options.teamId,
    sourceReferenceId: savedReference.id,
  });

  return savedReference;
};

const run = async () => {
  const options = parseArgs();

  await ensureTeamReference(options);

  const job = createSyncTeamJob();
  const result = await job.run({
    clubId: options.clubId,
    teamId: options.teamId,
    sourceTeamSlug: options.sourceTeamSlug,
    accessMode: 'public',
  });

  logger.info('Manual Futbol Aragon sync finished', {
    syncRunId: result.syncRunId,
    summary: result.summary,
  });
};

void run();
