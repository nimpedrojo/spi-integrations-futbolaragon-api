// Persists normalized calendars in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Calendar } from '../types/domain.types';

export class CalendarRepository {
  private readonly store = new JsonFileStore<Calendar>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'calendars.json'),
  );

  async saveMany(items: Calendar[]): Promise<number> {
    const existing = await this.store.readAll();
    const existingBySourceId = new Map(existing.map((item) => [item.sourceId, item]));
    const nextBySourceId = new Map(existing.map((item) => [item.sourceId, item]));

    for (const incoming of items) {
      const persisted = existingBySourceId.get(incoming.sourceId);

      nextBySourceId.set(incoming.sourceId, {
        ...persisted,
        ...incoming,
        id: persisted?.id ?? incoming.id,
        sourceId: incoming.sourceId,
      });
    }

    await this.store.writeAll(Array.from(nextBySourceId.values()));

    return items.length;
  }
}
