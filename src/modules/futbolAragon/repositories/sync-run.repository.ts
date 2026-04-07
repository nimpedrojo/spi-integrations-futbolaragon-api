// Tracks sync execution lifecycle independently from the business entities.
import { SyncRun, SyncRunSummary } from '../types/domain.types';

export class SyncRunRepository {
  private readonly runs = new Map<string, SyncRun>();

  async start(teamId: string): Promise<SyncRun> {
    const syncRun: SyncRun = {
      id: `sync-${teamId}-${Date.now()}`,
      teamId,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    this.runs.set(syncRun.id, syncRun);

    return syncRun;
  }

  async complete(syncRunId: string, summary: SyncRunSummary): Promise<SyncRun> {
    const existingRun = this.runs.get(syncRunId);

    if (!existingRun) {
      throw new Error(`Sync run not found: ${syncRunId}`);
    }

    const completedRun: SyncRun = {
      ...existingRun,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      summary,
    };

    this.runs.set(syncRunId, completedRun);

    return completedRun;
  }
}
