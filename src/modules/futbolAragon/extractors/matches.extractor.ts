// Extracts raw matches from the captured source payload.
import { RawSourceMatch, SourceSnapshot } from '../types/source.types';

export class MatchesExtractor {
  extract(snapshot: SourceSnapshot): RawSourceMatch[] {
    return snapshot.matches;
  }
}
