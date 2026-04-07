// Extracts calendar context and round navigation from public Futbol Aragon HTML without applying domain normalization.
import { load } from 'cheerio';

import { RawSourceCalendar, SourceSnapshot } from '../types/source.types';

export type SourceRoundReference = {
  name: string;
  number: number;
  dateLabel?: string;
  selected: boolean;
  url: string;
  query: {
    codPrimaria?: number;
    codCompeticion?: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada: number;
  };
};

export type SourceCalendar = {
  name: string;
  seasonLabel?: string;
  competitionName?: string;
  groupName?: string;
  competitionUrl?: string;
  calendarUrl?: string;
  standingsUrl?: string;
  query: {
    codPrimaria?: number;
    codCompeticion?: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada?: number;
  };
  rounds: SourceRoundReference[];
};

export type ExtractCalendarsResult = {
  calendars: SourceCalendar[];
};

const COMPETITION_PAGE_PATH = '/pnfg/NPcd/NFG_CmpJornada';
const DEFAULT_BASE_URL = 'https://www.futbolaragon.com';
const PAGE_CONTEXT_URL = `${DEFAULT_BASE_URL}${COMPETITION_PAGE_PATH}`;

export class CalendarsExtractor {
  extract(html: string): ExtractCalendarsResult;
  extract(snapshot: SourceSnapshot): RawSourceCalendar[];
  extract(input: string | SourceSnapshot): ExtractCalendarsResult | RawSourceCalendar[] {
    if (typeof input !== 'string') {
      // TODO: remove this compatibility path when the sync flow starts storing and extracting real HTML.
      return input.calendars;
    }

    const $ = load(input);
    const competitionSelect = $('#competicion');
    const groupSelect = $('#grupo');
    const roundSelect = $('#jornada');

    const selectedCompetitionValue = this.extractPreselectedValue(input, 'competicion');
    const selectedGroupValue = this.extractPreselectedValue(input, 'grupo');
    const selectedRoundValue = this.extractPreselectedValue(input, 'jornada');

    const selectedCompetitionOption = this.findSelectedOption($, '#competicion', selectedCompetitionValue);
    const selectedGroupOption = this.findSelectedOption($, '#grupo', selectedGroupValue);
    const selectedRoundOption = this.findSelectedOption($, '#jornada', selectedRoundValue);
    const selectedCompetitionNumber =
      this.parseNumber(selectedCompetitionValue) ?? this.parseNumber(this.extractMatch(input, /CodCompeticion=([0-9]+)/i));
    const selectedGroupNumber =
      this.parseNumber(selectedGroupValue) ?? this.parseNumber(this.extractMatch(input, /CodGrupo=([0-9]+)/i));
    const selectedRoundNumber =
      this.parseNumber(selectedRoundValue) ?? this.parseNumber(this.extractMatch(input, /CodJornada=([0-9]+)/i));

    const query = {
      codPrimaria: this.parseNumber(this.extractMatch(input, /cod_primaria=([0-9]+)/i)),
      codCompeticion: selectedCompetitionNumber,
      codGrupo: selectedGroupNumber,
      codTemporada: this.parseNumber(
        $('#temporada option:selected').attr('value') ?? this.extractMatch(input, /CodTemporada=([0-9]+)/i),
      ),
      codJornada: selectedRoundNumber,
    };

    const competitionName = this.cleanText(selectedCompetitionOption.text());
    const groupName = this.cleanText(selectedGroupOption.text());
    const seasonLabel = this.extractSeasonLabel($);
    const contextualTitle = this.extractContextualTitle($);
    const calendarUrl = this.extractFirstHref($, 'a[href*="NFG_VisCalendario_Vis"]');
    const standingsUrl = this.extractFirstHref($, 'a[href*="NFG_VisClasificacion"]');
    const competitionUrl = query.codCompeticion && query.codJornada
      ? this.buildCompetitionUrl({
          codPrimaria: query.codPrimaria,
          codCompeticion: query.codCompeticion,
          codGrupo: query.codGrupo,
          codTemporada: query.codTemporada,
          codJornada: query.codJornada,
        })
      : undefined;

    const rounds = roundSelect
      .find('option')
      .toArray()
      .reduce<SourceRoundReference[]>((result, option) => {
        const element = $(option);
        const rawValue = element.attr('value')?.trim();
        const roundNumber = this.parseNumber(rawValue);

        if (!roundNumber || roundNumber <= 0) {
          return result;
        }

        const label = this.cleanText(element.text());
        const selected = roundNumber === query.codJornada;
        const roundQuery = {
          codPrimaria: query.codPrimaria,
          codCompeticion: query.codCompeticion,
          codGrupo: query.codGrupo,
          codTemporada: query.codTemporada,
          codJornada: roundNumber,
        };

        result.push({
          name: label || `Jornada ${roundNumber}`,
          number: roundNumber,
          dateLabel: this.extractRoundDate(label),
          selected,
          url: this.buildCompetitionUrl(roundQuery),
          query: roundQuery,
        });

        return result;
      }, []);

    const calendarName = contextualTitle || [competitionName, groupName].filter(Boolean).join(' ');

    if (!calendarName && rounds.length === 0 && !calendarUrl) {
      return { calendars: [] };
    }

    return {
      calendars: [
        {
          name: calendarName || 'Calendario sin contexto visible',
          seasonLabel: seasonLabel || undefined,
          competitionName: competitionName || undefined,
          groupName: groupName || undefined,
          competitionUrl,
          calendarUrl,
          standingsUrl,
          query,
          rounds,
        },
      ],
    };
  }

  private extractSeasonLabel($: ReturnType<typeof load>): string | undefined {
    const seasonFromSelectedOption = this.cleanText($('#temporada option[selected], #temporada option:selected').first().text());
    const seasonFromHeading = this.cleanText(
      $('h3 strong')
        .toArray()
        .map((node) => $(node).text())
        .find((text) => text.includes('Temporada')),
    );

    return seasonFromHeading || seasonFromSelectedOption || undefined;
  }

  private extractContextualTitle($: ReturnType<typeof load>): string | undefined {
    return (
      this.cleanText(
        $('h3.la_roja_regular_titulo1 strong, h3.la_roja_regular_titulo1')
          .first()
          .text(),
      ) || undefined
    );
  }

  private extractFirstHref($: ReturnType<typeof load>, selector: string): string | undefined {
    const href = $(selector).first().attr('href');

    if (!href) {
      return undefined;
    }

    return new URL(href, PAGE_CONTEXT_URL).toString();
  }

  private findSelectedOption($: ReturnType<typeof load>, selector: string, selectedValue?: string) {
    if (selectedValue) {
        const selectedOption = $(`${selector} option`)
          .filter((_, option) => $(option).attr('value')?.trim() === selectedValue)
          .first();

      if (selectedOption.length > 0) {
        return selectedOption;
      }
    }

    return $(`${selector} option[selected], ${selector} option:selected`).first();
  }

  private extractPreselectedValue(html: string, elementId: string): string | undefined {
    const escapedId = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`Select_Preselecciona\\(document\\.getElementById\\("${escapedId}"\\),"([^"]+)"\\)`);

    return this.extractMatch(html, pattern);
  }

  private buildCompetitionUrl(query: SourceRoundReference['query']): string {
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

  private extractRoundDate(label: string): string | undefined {
    const match = label.match(/([0-9]{2}-[0-9]{2}-[0-9]{4})/);

    return match?.[1];
  }

  private extractMatch(html: string, pattern: RegExp): string | undefined {
    return html.match(pattern)?.[1];
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
