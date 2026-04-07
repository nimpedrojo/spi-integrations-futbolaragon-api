// Extracts raw standings from the captured source payload.
import { RawSourceStanding, SourceSnapshot } from '../types/source.types';

export class StandingsExtractor {
  extract(snapshot: SourceSnapshot): RawSourceStanding[] {
    return snapshot.standings;
  }
}
