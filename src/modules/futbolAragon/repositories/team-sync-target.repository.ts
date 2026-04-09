// Loads the list of team targets to be synchronized in batch mode.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { TeamSyncTarget } from '../types/domain.types';

export class TeamSyncTargetRepository {
  private readonly store = new JsonFileStore<TeamSyncTarget>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'config', 'team-sync-targets.json'),
  );

  async findEnabled(): Promise<TeamSyncTarget[]> {
    const targets = await this.store.readAll();

    return targets.filter((target) => target.enabled);
  }
}
