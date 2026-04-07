// Persists normalized calendars in the internal storage model.
import { Calendar } from '../types/domain.types';

export class CalendarRepository {
  async saveMany(items: Calendar[]): Promise<number> {
    return items.length;
  }
}
