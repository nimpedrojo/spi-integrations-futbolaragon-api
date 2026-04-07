// Tracks sync execution lifecycle independently from the business entities using filesystem-backed JSON.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { SyncRun, SyncRunIssue, SyncRunSummary } from '../types/domain.types';

export class SyncRunRepository {
  private readonly runs = new Map<string, SyncRun>();
  private readonly store = new JsonFileStore<SyncRun>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'sync-runs.json'),
  );

  async start(teamId: string): Promise<SyncRun> {
    const syncRun: SyncRun = {
      id: `sync-${teamId}-${Date.now()}`,
      teamId,
      sourceSystem: 'futbol-aragon',
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    this.runs.set(syncRun.id, syncRun);
    await this.store.upsertOne(syncRun, (item) => item.id);

    return syncRun;
  }

  async complete(syncRunId: string, summary: SyncRunSummary, issues: SyncRunIssue[] = []): Promise<SyncRun> {
    const existingRun = this.runs.get(syncRunId);

    if (!existingRun) {
      throw new Error(`Sync run not found: ${syncRunId}`);
    }

    const completedRun: SyncRun = {
      ...existingRun,
      status: issues.length > 0 ? 'completed_with_warnings' : 'completed',
      finishedAt: new Date().toISOString(),
      summary,
      issues: issues.length > 0 ? issues : existingRun.issues,
    };

    this.runs.set(syncRunId, completedRun);
    await this.store.upsertOne(completedRun, (item) => item.id);

    return completedRun;
  }

  async fail(syncRunId: string, errorMessage: string, issues: SyncRunIssue[] = []): Promise<SyncRun> {
    const existingRun = this.runs.get(syncRunId);

    if (!existingRun) {
      throw new Error(`Sync run not found: ${syncRunId}`);
    }

    const failedRun: SyncRun = {
      ...existingRun,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      errorMessage,
      issues,
    };

    this.runs.set(syncRunId, failedRun);
    await this.store.upsertOne(failedRun, (item) => item.id);

    return failedRun;
  }
}
