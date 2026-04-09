// Persists normalized matches in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Match } from '../types/domain.types';

export class MatchRepository {
  private readonly store = new JsonFileStore<Match>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'matches.json'),
  );

  async saveMany(items: Match[]): Promise<number> {
    const existing = await this.store.readAll();
    const existingBySourceId = new Map(existing.map((item) => [item.sourceId, item]));
    const nextBySourceId = new Map(existing.map((item) => [item.sourceId, item]));

    for (const incoming of items) {
      const persisted = existingBySourceId.get(incoming.sourceId);

      nextBySourceId.set(incoming.sourceId, {
        ...persisted,
        ...incoming,
        // Preserve the persisted identifier so downstream relations remain stable across reprocessing.
        id: persisted?.id ?? incoming.id,
        sourceId: incoming.sourceId,
      });
    }

    await this.store.writeAll(Array.from(nextBySourceId.values()));

    return items.length;
  }
}
