// Persists normalized calendars in a filesystem-backed store for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { Calendar } from '../types/domain.types';

export class CalendarRepository {
  private readonly store = new JsonFileStore<Calendar>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'calendars.json'),
  );

  async saveMany(items: Calendar[]): Promise<number> {
    await this.store.upsertMany(items, (item) => item.id);

    return items.length;
  }
}
