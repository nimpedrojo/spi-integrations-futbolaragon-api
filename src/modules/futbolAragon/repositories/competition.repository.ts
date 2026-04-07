// Persists normalized competitions in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Competition } from '../types/domain.types';

export class CompetitionRepository {
  private readonly store = new JsonFileStore<Competition>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'competitions.json'),
  );

  async saveMany(items: Competition[]): Promise<number> {
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
