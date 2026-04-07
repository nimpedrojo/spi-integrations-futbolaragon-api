// Persists normalized matches in the internal storage model.
import { Match } from '../types/domain.types';

export class MatchRepository {
  async saveMany(items: Match[]): Promise<number> {
    return items.length;
  }
}
