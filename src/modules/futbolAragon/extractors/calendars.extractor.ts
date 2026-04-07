// Extracts raw calendars from the captured source payload.
import { RawSourceCalendar, SourceSnapshot } from '../types/source.types';

export class CalendarsExtractor {
  extract(snapshot: SourceSnapshot): RawSourceCalendar[] {
    return snapshot.calendars;
  }
}
