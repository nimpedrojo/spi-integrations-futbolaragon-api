// Persists normalized standings in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Standing } from '../types/domain.types';

export class StandingRepository {
  private readonly store = new JsonFileStore<Standing>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'standings.json'),
  );

  async saveMany(items: Standing[]): Promise<number> {
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
