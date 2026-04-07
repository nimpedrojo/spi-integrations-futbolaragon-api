// Extracts round navigation and visible round context from public Futbol Aragon HTML without applying domain normalization.
import { load } from 'cheerio';

import { RawSourceRound, SourceSnapshot } from '../types/source.types';

export type SourceRound = {
  name: string;
  number: number;
  selected: boolean;
  url: string;
  dateLabel?: string;
  state?: string;
  visibleContext?: string;
  navigation?: {
    previousUrl?: string;
    nextUrl?: string;
  };
  query: {
    codPrimaria?: number;
    codCompeticion?: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada: number;
  };
};

export type ExtractRoundsResult = {
  rounds: SourceRound[];
};

const COMPETITION_PAGE_PATH = '/pnfg/NPcd/NFG_CmpJornada';
const DEFAULT_BASE_URL = 'https://www.futbolaragon.com';

export class RoundsExtractor {
  extract(html: string): ExtractRoundsResult;
  extract(snapshot: SourceSnapshot): RawSourceRound[];
  extract(input: string | SourceSnapshot): ExtractRoundsResult | RawSourceRound[] {
    if (typeof input !== 'string') {
      // TODO: remove this compatibility path when the sync flow starts storing and extracting real HTML.
      return input.rounds;
    }

    const $ = load(input);
    const selectedRoundValue = this.extractPreselectedValue(input, 'jornada');
    const selectedRoundNumber =
      this.parseNumber(selectedRoundValue) ?? this.parseNumber(this.extractMatch(input, /CodJornada=([0-9]+)/i));

    const baseQuery = {
      codPrimaria: this.parseNumber(this.extractMatch(input, /cod_primaria=([0-9]+)/i)),
      codCompeticion: this.parseNumber(
        this.extractPreselectedValue(input, 'competicion') ?? this.extractMatch(input, /CodCompeticion=([0-9]+)/i),
      ),
      codGrupo: this.parseNumber(
        this.extractPreselectedValue(input, 'grupo') ?? this.extractMatch(input, /CodGrupo=([0-9]+)/i),
      ),
      codTemporada: this.parseNumber(this.extractMatch(input, /CodTemporada=([0-9]+)/i)),
    };

    const visibleContext = this.cleanText($('h3.jornada').first().text()) || undefined;
    const navigation = {
      previousUrl: this.extractRoundNavigationUrl($, /IrA\(([0-9]+)\)/, 'prev'),
      nextUrl: this.extractRoundNavigationUrl($, /IrA\(([0-9]+)\)/, 'next'),
    };

    const seenRoundNumbers = new Set<number>();
    const rounds = $('#jornada option')
      .toArray()
      .reduce<SourceRound[]>((result, option) => {
        const element = $(option);
        const number = this.parseNumber(element.attr('value')?.trim());

        if (!number || number <= 0 || seenRoundNumbers.has(number)) {
          return result;
        }

        seenRoundNumbers.add(number);

        const label = this.cleanText(element.text());
        const query = {
          ...baseQuery,
          codJornada: number,
        };

        result.push({
          name: label || `Jornada ${number}`,
          number,
          selected: number === selectedRoundNumber,
          url: this.buildRoundUrl(query),
          dateLabel: this.extractRoundDate(label),
          // TODO: no round-specific state has been confirmed yet beyond the global legend on the page.
          state: undefined,
          visibleContext: number === selectedRoundNumber ? visibleContext : undefined,
          navigation: number === selectedRoundNumber ? navigation : undefined,
          query,
        });

        return result;
      }, []);

    return { rounds };
  }

  private buildRoundUrl(query: SourceRound['query']): string {
    const url = new URL(COMPETITION_PAGE_PATH, DEFAULT_BASE_URL);

    if (query.codPrimaria !== undefined) {
      url.searchParams.set('cod_primaria', String(query.codPrimaria));
    }

    if (query.codCompeticion !== undefined) {
      url.searchParams.set('CodCompeticion', String(query.codCompeticion));
    }

    if (query.codGrupo !== undefined) {
      url.searchParams.set('CodGrupo', String(query.codGrupo));
    }

    if (query.codTemporada !== undefined) {
      url.searchParams.set('CodTemporada', String(query.codTemporada));
    }

    url.searchParams.set('CodJornada', String(query.codJornada));

    return url.toString();
  }

  private extractRoundNavigationUrl(
    $: ReturnType<typeof load>,
    pattern: RegExp,
    direction: 'prev' | 'next',
  ): string | undefined {
    const anchors = $('#divResultados a')
      .toArray()
      .map((node) => $(node))
      .filter((anchor) => anchor.attr('href')?.includes('javascript:IrA('));

    const targetAnchor =
      direction === 'prev'
        ? anchors.find((anchor) => this.cleanText(anchor.text()).includes('Anterior'))
        : anchors.find((anchor) => this.cleanText(anchor.text()).includes('Siguiente'));

    const href = targetAnchor?.attr('href');
    const roundNumber = this.parseNumber(href?.match(pattern)?.[1]);

    if (!roundNumber) {
      return undefined;
    }

    const html = $.html();

    return this.buildRoundUrl({
      codPrimaria: this.parseNumber(this.extractMatch(html, /cod_primaria=([0-9]+)/i)),
      codCompeticion: this.parseNumber(
        this.extractPreselectedValue(html, 'competicion') ?? this.extractMatch(html, /CodCompeticion=([0-9]+)/i),
      ),
      codGrupo: this.parseNumber(
        this.extractPreselectedValue(html, 'grupo') ?? this.extractMatch(html, /CodGrupo=([0-9]+)/i),
      ),
      codTemporada: this.parseNumber(this.extractMatch(html, /CodTemporada=([0-9]+)/i)),
      codJornada: roundNumber,
    });
  }

  private extractPreselectedValue(html: string, elementId: string): string | undefined {
    const escapedId = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`Select_Preselecciona\\(document\\.getElementById\\("${escapedId}"\\),"([^"]+)"\\)`);

    return this.extractMatch(html, pattern);
  }

  private extractMatch(html: string, pattern: RegExp): string | undefined {
    return html.match(pattern)?.[1];
  }

  private extractRoundDate(label: string): string | undefined {
    const match = label.match(/([0-9]{2}-[0-9]{2}-[0-9]{4})/);

    return match?.[1];
  }

  private parseNumber(value?: string): number | undefined {
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
