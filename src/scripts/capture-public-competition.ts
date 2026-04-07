// Fetches the documented public competition page and stores the raw HTML for inspection.
import path from 'node:path';

import { logger } from '../shared/logger/logger';
import {
  documentedCompetitionPageParams,
  documentedCompetitionPagePath,
  PublicFutbolAragonClient,
} from '../modules/futbolAragon/client/public-client';
import { RawCaptureRepository } from '../modules/futbolAragon/repositories/raw-capture.repository';

const run = async () => {
  const client = new PublicFutbolAragonClient();
  const rawCaptureRepository = new RawCaptureRepository();
  const requestedPathOrUrl = process.argv[2];

  logger.info('Starting public competition raw capture', {
    requestedPathOrUrl,
    fallbackParams: documentedCompetitionPageParams,
  });

  const page = requestedPathOrUrl
    ? await client.fetchPage(requestedPathOrUrl)
    : await client.getCompetitionPage(documentedCompetitionPageParams);
  const capture = await rawCaptureRepository.savePage(
    {
      key: 'public-competition-page',
      entityType: 'competition-page',
      sourceUrl: requestedPathOrUrl ?? documentedCompetitionPagePath(client),
      accessMode: 'public',
      page,
      parseStatus: 'pending',
      outputDirectory: path.resolve(process.cwd(), '.raw-captures', 'futbol-aragon'),
    },
  );

  logger.info('Stored public competition raw capture', {
    sourceUrl: capture.sourceUrl,
    resolvedUrl: capture.resolvedUrl,
    statusCode: capture.httpStatus,
    durationMs: capture.durationMs,
    outputPath: capture.outputPath,
    contentHash: capture.contentHash,
  });
};

void run();
