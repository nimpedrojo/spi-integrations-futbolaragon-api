// Extracts raw competitions from the captured source payload.
import { RawSourceCompetition, SourceSnapshot } from '../types/source.types';

export class CompetitionsExtractor {
  extract(snapshot: SourceSnapshot): RawSourceCompetition[] {
    return snapshot.competitions;
  }
}
