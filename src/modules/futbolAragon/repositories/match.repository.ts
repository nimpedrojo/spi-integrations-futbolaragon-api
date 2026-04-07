// Persists normalized matches in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Match } from '../types/domain.types';

export class MatchRepository {
  private readonly store = new JsonFileStore<Match>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'matches.json'),
  );

  async saveMany(items: Match[]): Promise<number> {
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
