// Normalizes source rounds into the internal domain model.
import { SourceRound } from '../extractors/rounds.extractor';
import { Round } from '../types/domain.types';
import { RawSourceRound } from '../types/source.types';

type RoundNormalizerOptions = {
  calendarId?: string;
};

export class RoundNormalizer {
  normalize(items: RawSourceRound[] | SourceRound[], options?: RoundNormalizerOptions): Round[] {
    return items.map((item) => {
      if ('query' in item) {
        const sourceId = this.buildRoundSourceId(item);

        return {
          id: `round-${sourceId}`,
          sourceId,
          calendarId: options?.calendarId ?? this.buildCalendarId(item),
          name: item.name,
          order: item.number,
          number: item.number,
          dateLabel: item.dateLabel,
          status: item.state === 'completed' || item.state === 'in_progress' || item.state === 'scheduled'
            ? item.state
            : undefined,
        };
      }

      return {
        id: item.sourceId,
        sourceId: item.sourceId,
        calendarId: item.calendarSourceId,
        name: item.name,
        order: item.order,
      };
    });
  }

  private buildCalendarId(item: SourceRound): string {
    const sourceId = [
      item.query.codCompeticion ?? 'unknown-competition',
      item.query.codGrupo ?? 'unknown-group',
      item.query.codTemporada ?? 'unknown-season',
    ].join(':');

    return `calendar-${sourceId}`;
  }

  private buildRoundSourceId(item: SourceRound): string {
    return [
      item.query.codCompeticion ?? 'unknown-competition',
      item.query.codGrupo ?? 'unknown-group',
      item.query.codJornada,
    ].join(':');
  }
}
