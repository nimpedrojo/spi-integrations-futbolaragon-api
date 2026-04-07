// Normalizes source calendars into the internal domain model.
import { Calendar } from '../types/domain.types';
import { RawSourceCalendar } from '../types/source.types';

export class CalendarNormalizer {
  normalize(items: RawSourceCalendar[]): Calendar[] {
    return items.map((item) => ({
      id: item.sourceId,
      sourceId: item.sourceId,
      competitionId: item.competitionSourceId,
      teamId: item.teamId,
      name: item.name,
    }));
  }
}
