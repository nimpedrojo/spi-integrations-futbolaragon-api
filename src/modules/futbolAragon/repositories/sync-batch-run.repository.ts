// Tracks multi-team batch execution lifecycle in a filesystem-backed JSON store.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { SyncBatchRun, SyncBatchRunStatus, SyncTeamsResultItem } from '../types/domain.types';

export class SyncBatchRunRepository {
  private readonly runs = new Map<string, SyncBatchRun>();
  private readonly store = new JsonFileStore<SyncBatchRun>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'sync-batch-runs.json'),
  );

  async start(teamIds: string[]): Promise<SyncBatchRun> {
    const syncBatchRun: SyncBatchRun = {
      id: `sync-batch-${Date.now()}`,
      startedAt: new Date().toISOString(),
      status: 'running',
      totalTeams: teamIds.length,
      successCount: 0,
      partialCount: 0,
      failedCount: 0,
      teamIds,
    };

    this.runs.set(syncBatchRun.id, syncBatchRun);
    await this.store.upsertOne(syncBatchRun, (item) => item.id);

    return syncBatchRun;
  }

  async complete(
    batchRunId: string,
    input: {
      status: SyncBatchRunStatus;
      totalTeams: number;
      successCount: number;
      partialCount: number;
      failedCount: number;
      results: SyncTeamsResultItem[];
    },
  ): Promise<SyncBatchRun> {
    const existingRun = this.runs.get(batchRunId);

    if (!existingRun) {
      throw new Error(`Sync batch run not found: ${batchRunId}`);
    }

    const completedRun: SyncBatchRun = {
      ...existingRun,
      status: input.status,
      finishedAt: new Date().toISOString(),
      totalTeams: input.totalTeams,
      successCount: input.successCount,
      partialCount: input.partialCount,
      failedCount: input.failedCount,
      summary: {
        results: input.results,
      },
    };

    this.runs.set(batchRunId, completedRun);
    await this.store.upsertOne(completedRun, (item) => item.id);

    return completedRun;
  }

  async fail(batchRunId: string, errorMessage: string): Promise<SyncBatchRun> {
    const existingRun = this.runs.get(batchRunId);

    if (!existingRun) {
      throw new Error(`Sync batch run not found: ${batchRunId}`);
    }

    const failedRun: SyncBatchRun = {
      ...existingRun,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      errorMessage,
    };

    this.runs.set(batchRunId, failedRun);
    await this.store.upsertOne(failedRun, (item) => item.id);

    return failedRun;
  }
}
