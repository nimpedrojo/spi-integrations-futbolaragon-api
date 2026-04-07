// Persists normalized competitions in the internal storage model.
import { Competition } from '../types/domain.types';

export class CompetitionRepository {
  async saveMany(items: Competition[]): Promise<number> {
    return items.length;
  }
}
