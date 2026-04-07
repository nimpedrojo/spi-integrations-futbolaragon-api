// Normalizes source competitions into the internal domain model.
import { Competition } from '../types/domain.types';
import { RawSourceCompetition } from '../types/source.types';

export class CompetitionNormalizer {
  normalize(items: RawSourceCompetition[]): Competition[] {
    return items.map((item) => ({
      id: item.sourceId,
      sourceId: item.sourceId,
      name: item.name,
      teamId: item.teamId,
      season: item.season,
    }));
  }
}
