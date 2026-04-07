// Normalizes source matches into the internal domain model.
import { SourceMatch } from '../extractors/matches.extractor';
import { Match } from '../types/domain.types';
import { RawSourceMatch } from '../types/source.types';

type MatchNormalizerOptions = {
  roundIdResolver?: (item: SourceMatch) => string;
};

export class MatchNormalizer {
  normalize(items: RawSourceMatch[] | SourceMatch[], options?: MatchNormalizerOptions): Match[] {
    return items.map((item) => {
      if ('query' in item) {
        const sourceId = this.buildMatchSourceId(item);
        const scores = this.extractScores(item.result);

        return {
          id: `match-${sourceId}`,
          sourceId,
          roundId: options?.roundIdResolver?.(item) ?? this.buildRoundId(item),
          homeTeamName: item.homeTeam,
          awayTeamName: item.awayTeam,
          kickoffAt: this.buildKickoffAt(item),
          status: this.normalizeStatus(item.status),
          result: item.result,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          venue: item.venue,
          sourceUrl: item.url,
        };
      }

      return {
        id: item.sourceId,
        sourceId: item.sourceId,
        roundId: item.roundSourceId,
        homeTeamName: item.homeTeamName,
        awayTeamName: item.awayTeamName,
        kickoffAt: item.kickoffAt,
        status: item.status,
      };
    });
  }

  private buildRoundId(item: SourceMatch): string {
    const sourceId = [
      item.query.codCompeticion ?? 'unknown-competition',
      item.query.codGrupo ?? 'unknown-group',
      item.query.codJornada ?? 'unknown-round',
    ].join(':');

    return `round-${sourceId}`;
  }

  private buildMatchSourceId(item: SourceMatch): string {
    if (item.query.codActa) {
      return String(item.query.codActa);
    }

    return [
      item.query.codCompeticion ?? 'unknown-competition',
      item.query.codGrupo ?? 'unknown-group',
      item.query.codJornada ?? 'unknown-round',
      item.homeTeam,
      item.awayTeam,
      item.date ?? 'unknown-date',
      item.time ?? 'unknown-time',
    ].join(':');
  }

  private buildKickoffAt(item: SourceMatch): string {
    return [item.date, item.time].filter(Boolean).join(' ').trim() || 'unknown-kickoff';
  }

  private normalizeStatus(status?: string): Match['status'] {
    if (
      status === 'scheduled' ||
      status === 'in_progress' ||
      status === 'played' ||
      status === 'final' ||
      status === 'provisional'
    ) {
      return status;
    }

    return 'scheduled';
  }

  private extractScores(result?: string): { homeScore?: number; awayScore?: number } {
    if (!result) {
      return {};
    }

    const match = result.match(/(\d+)\s*-\s*(\d+)/);

    if (!match) {
      return {};
    }

    return {
      homeScore: Number(match[1]),
      awayScore: Number(match[2]),
    };
  }
}
