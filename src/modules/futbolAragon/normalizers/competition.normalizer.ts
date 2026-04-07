// Normalizes source competitions into the internal domain model.
import { SourceCompetition } from '../extractors/competitions.extractor';
import { Competition } from '../types/domain.types';
import { RawSourceCompetition } from '../types/source.types';

type CompetitionNormalizerOptions = {
  teamId: string;
  season?: string;
};

export class CompetitionNormalizer {
  normalize(items: RawSourceCompetition[] | SourceCompetition[], options?: CompetitionNormalizerOptions): Competition[] {
    return items.map((item) => {
      if ('query' in item) {
        const sourceId = String(item.query.codCompeticion);

        return {
          id: `competition-${sourceId}`,
          sourceId,
          name: item.name,
          teamId: options?.teamId ?? 'unknown-team',
          season: options?.season ?? String(item.query.codTemporada ?? 'unknown-season'),
          sourceSystem: 'futbol-aragon',
          externalCode: sourceId,
          groupName: item.optgroupLabel,
          status: item.selected ? 'active' : undefined,
        };
      }

      return {
        id: item.sourceId,
        sourceId: item.sourceId,
        name: item.name,
        teamId: item.teamId,
        season: item.season,
      };
    });
  }
}
