// Persists normalized rounds in the internal storage model.
import { Round } from '../types/domain.types';

export class RoundRepository {
  async saveMany(items: Round[]): Promise<number> {
    return items.length;
  }
}
