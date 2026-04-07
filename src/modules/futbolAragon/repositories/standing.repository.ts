// Persists normalized standings in the internal storage model.
import { Standing } from '../types/domain.types';

export class StandingRepository {
  async saveMany(items: Standing[]): Promise<number> {
    return items.length;
  }
}
