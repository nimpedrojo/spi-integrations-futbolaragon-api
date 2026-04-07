// Normalizes source standings into the internal domain model.
import { Standing } from '../types/domain.types';
import { RawSourceStanding } from '../types/source.types';

export class StandingNormalizer {
  normalize(items: RawSourceStanding[]): Standing[] {
    return items.map((item) => ({
      id: item.sourceId,
      sourceId: item.sourceId,
      competitionId: item.competitionSourceId,
      teamName: item.teamName,
      position: item.position,
      points: item.points,
    }));
  }
}
