// Persists normalized rounds in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Round } from '../types/domain.types';

export class RoundRepository {
  private readonly store = new JsonFileStore<Round>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'rounds.json'),
  );

  async saveMany(items: Round[]): Promise<number> {
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
