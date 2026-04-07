// Exposes the sync orchestration as a job entry point.
import { createSyncTeamService, SyncTeamService } from '../services/sync-team.service';
import { SyncTeamResult, TeamSyncRequest } from '../types/domain.types';

export class SyncTeamJob {
  constructor(private readonly syncTeamService: SyncTeamService) {}

  async run(request: TeamSyncRequest): Promise<SyncTeamResult> {
    return this.syncTeamService.execute(request);
  }
}

export const createSyncTeamJob = () => new SyncTeamJob(createSyncTeamService());
