// Extracts competition options from the public Futbol Aragon HTML without applying domain normalization.
import { load } from 'cheerio';

import { RawSourceCompetition, SourceSnapshot } from '../types/source.types';

export type SourceCompetition = {
  name: string;
  url: string;
  query: {
    codPrimaria?: number;
    codCompeticion: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada?: number;
  };
  optgroupLabel?: string;
  selected: boolean;
};

export type ExtractCompetitionsResult = {
  competitions: SourceCompetition[];
};

const COMPETITION_PAGE_PATH = '/pnfg/NPcd/NFG_CmpJornada';

export class CompetitionsExtractor {
  extract(html: string): ExtractCompetitionsResult;
  extract(snapshot: SourceSnapshot): RawSourceCompetition[];
  extract(input: string | SourceSnapshot): ExtractCompetitionsResult | RawSourceCompetition[] {
    if (typeof input !== 'string') {
      // TODO: remove this compatibility path when the sync flow starts storing and extracting real HTML.
      return input.competitions;
    }

    const $ = load(input);
    const currentContext = {
      codPrimaria: this.parseNumericValue(this.extractCodPrimaria(input) ?? $('input[name="cod_primaria"]').attr('value')),
      codTemporada: this.parseNumericValue($('#temporada option:selected').attr('value')),
      codGrupo: this.parseNumericValue($('#grupo option:selected').attr('value')),
      codJornada: this.parseNumericValue($('#jornada option:selected').attr('value')),
    };

    const competitions = $('#competicion option').toArray().reduce<SourceCompetition[]>((result, option) => {
        const element = $(option);
        const rawValue = element.attr('value')?.trim();
        const codCompeticion = this.parseNumericValue(rawValue);
        const name = this.cleanText(element.text());

        if (!codCompeticion || !name || codCompeticion <= 0) {
          return result;
        }

        const optgroupLabel = this.cleanText(element.parent('optgroup').attr('label'));
        const selected = element.is('[selected]') || codCompeticion === this.parseNumericValue($('#competicion').val()?.toString());
        const query = {
          codPrimaria: currentContext.codPrimaria,
          codCompeticion,
          codTemporada: currentContext.codTemporada,
          // TODO: for non-selected competitions, CodGrupo and CodJornada require a second-step navigation after group loading.
          codGrupo: selected ? currentContext.codGrupo : undefined,
          codJornada: selected ? currentContext.codJornada : undefined,
        };

        result.push({
          name,
          url: this.buildCompetitionUrl(query),
          query,
          optgroupLabel: optgroupLabel || undefined,
          selected,
        });

        return result;
      }, []);

    return { competitions };
  }

  private buildCompetitionUrl(query: SourceCompetition['query']): string {
    const url = new URL(COMPETITION_PAGE_PATH, 'https://www.futbolaragon.com');

    if (query.codPrimaria !== undefined) {
      url.searchParams.set('cod_primaria', String(query.codPrimaria));
    }

    url.searchParams.set('CodCompeticion', String(query.codCompeticion));

    if (query.codGrupo !== undefined) {
      url.searchParams.set('CodGrupo', String(query.codGrupo));
    }

    if (query.codTemporada !== undefined) {
      url.searchParams.set('CodTemporada', String(query.codTemporada));
    }

    if (query.codJornada !== undefined) {
      url.searchParams.set('CodJornada', String(query.codJornada));
    }

    return url.toString();
  }

  private extractCodPrimaria(html: string): string | undefined {
    const match = html.match(/cod_primaria=([0-9]+)/i);

    return match?.[1];
  }

  private parseNumericValue(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private cleanText(value?: string): string {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }
}
