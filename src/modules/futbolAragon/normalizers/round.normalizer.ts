// Normalizes source rounds into the internal domain model.
import { Round } from '../types/domain.types';
import { RawSourceRound } from '../types/source.types';

export class RoundNormalizer {
  normalize(items: RawSourceRound[]): Round[] {
    return items.map((item) => ({
      id: item.sourceId,
      sourceId: item.sourceId,
      calendarId: item.calendarSourceId,
      name: item.name,
      order: item.order,
    }));
  }
}
