// Normalizes source standings into the internal domain model.
import { SourceStandingRow } from '../extractors/standings.extractor';
import { Standing } from '../types/domain.types';
import { RawSourceStanding } from '../types/source.types';

export class StandingNormalizer {
  normalize(items: RawSourceStanding[] | SourceStandingRow[]): Standing[] {
    return items.map((item) => {
      if ('query' in item) {
        const sourceId = String(item.query.codigoEquipo ?? `${item.query.codCompeticion ?? 'unknown'}:${item.position}`);

        return {
          id: `standing-${sourceId}`,
          sourceId,
          competitionId: `competition-${item.query.codCompeticion ?? 'unknown'}`,
          teamName: item.teamName,
          position: item.position,
          points: item.points ?? 0,
          played: item.played,
          won: item.won,
          drawn: item.drawn,
          lost: item.lost,
          goalsFor: item.goalsFor,
          goalsAgainst: item.goalsAgainst,
          goalDifference:
            item.goalsFor !== undefined && item.goalsAgainst !== undefined ? item.goalsFor - item.goalsAgainst : undefined,
          sourceUrl: item.url,
        };
      }

      return {
        id: item.sourceId,
        sourceId: item.sourceId,
        competitionId: item.competitionSourceId,
        teamName: item.teamName,
        position: item.position,
        points: item.points,
      };
    });
  }
}
