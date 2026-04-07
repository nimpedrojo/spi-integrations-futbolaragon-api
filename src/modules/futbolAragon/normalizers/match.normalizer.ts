// Normalizes source matches into the internal domain model.
import { Match } from '../types/domain.types';
import { RawSourceMatch } from '../types/source.types';

export class MatchNormalizer {
  normalize(items: RawSourceMatch[]): Match[] {
    return items.map((item) => ({
      id: item.sourceId,
      sourceId: item.sourceId,
      roundId: item.roundSourceId,
      homeTeamName: item.homeTeamName,
      awayTeamName: item.awayTeamName,
      kickoffAt: item.kickoffAt,
      status: item.status,
    }));
  }
}
