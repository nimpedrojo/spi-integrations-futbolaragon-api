// Persists normalized standings in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Standing } from '../types/domain.types';

export class StandingRepository {
  private readonly store = new JsonFileStore<Standing>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'standings.json'),
  );

  async saveMany(items: Standing[]): Promise<number> {
    // Standings are treated as a lightweight current snapshot in this spike.
    // We do not introduce a stronger incremental identity yet beyond the current normalized id/sourceId,
    // because row identity may evolve later when standings modeling is hardened.
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
