// Extracts raw rounds from the captured source payload.
import { RawSourceRound, SourceSnapshot } from '../types/source.types';

export class RoundsExtractor {
  extract(snapshot: SourceSnapshot): RawSourceRound[] {
    return snapshot.rounds;
  }
}
