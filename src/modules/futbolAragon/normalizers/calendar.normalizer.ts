// Normalizes source calendars into the internal domain model.
import { SourceCalendar } from '../extractors/calendars.extractor';
import { Calendar } from '../types/domain.types';
import { RawSourceCalendar } from '../types/source.types';

type CalendarNormalizerOptions = {
  teamId: string;
};

export class CalendarNormalizer {
  normalize(items: RawSourceCalendar[] | SourceCalendar[], options?: CalendarNormalizerOptions): Calendar[] {
    return items.map((item) => {
      if ('query' in item) {
        const sourceId = this.buildCalendarSourceId(item);

        return {
          id: `calendar-${sourceId}`,
          sourceId,
          competitionId: `competition-${item.query.codCompeticion ?? 'unknown'}`,
          teamId: options?.teamId ?? 'unknown-team',
          name: item.name,
          seasonLabel: item.seasonLabel,
          visibleContext: [item.competitionName, item.groupName].filter(Boolean).join(' · ') || undefined,
        };
      }

      return {
        id: item.sourceId,
        sourceId: item.sourceId,
        competitionId: item.competitionSourceId,
        teamId: item.teamId,
        name: item.name,
      };
    });
  }

  private buildCalendarSourceId(item: SourceCalendar): string {
    return [
      item.query.codCompeticion ?? 'unknown-competition',
      item.query.codGrupo ?? 'unknown-group',
      item.query.codTemporada ?? 'unknown-season',
    ].join(':');
  }
}
