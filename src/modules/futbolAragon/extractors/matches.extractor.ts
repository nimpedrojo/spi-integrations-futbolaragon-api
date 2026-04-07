// Extracts match cards from public Futbol Aragon HTML without applying domain normalization.
import { Cheerio, load } from 'cheerio';
import type { AnyNode } from 'domhandler';

import { RawSourceMatch, SourceSnapshot } from '../types/source.types';

export type SourceMatch = {
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time?: string;
  result?: string;
  status?: string;
  url?: string;
  venue?: string;
  visibleContext?: string;
  query: {
    codPrimaria?: number;
    codCompeticion?: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada?: number;
    codActa?: number;
  };
};

export type ExtractMatchesResult = {
  matches: SourceMatch[];
};

const DEFAULT_BASE_URL = 'https://www.futbolaragon.com';
const PAGE_CONTEXT_URL = `${DEFAULT_BASE_URL}/pnfg/NPcd/NFG_CmpJornada`;

export class MatchesExtractor {
  extract(html: string): ExtractMatchesResult;
  extract(snapshot: SourceSnapshot): RawSourceMatch[];
  extract(input: string | SourceSnapshot): ExtractMatchesResult | RawSourceMatch[] {
    if (typeof input !== 'string') {
      // TODO: remove this compatibility path when the sync flow starts storing and extracting real HTML.
      return input.matches;
    }

    const $ = load(input);
    const baseQuery = {
      codPrimaria: this.parseNumber(this.extractMatch(input, /cod_primaria=([0-9]+)/i)),
      codCompeticion: this.parseNumber(
        this.extractPreselectedValue(input, 'competicion') ?? this.extractMatch(input, /CodCompeticion=([0-9]+)/i),
      ),
      codGrupo: this.parseNumber(
        this.extractPreselectedValue(input, 'grupo') ?? this.extractMatch(input, /CodGrupo=([0-9]+)/i),
      ),
      codTemporada: this.parseNumber(this.extractMatch(input, /CodTemporada=([0-9]+)/i)),
      codJornada: this.parseNumber(
        this.extractPreselectedValue(input, 'jornada') ?? this.extractMatch(input, /CodJornada=([0-9]+)/i),
      ),
    };
    const visibleContext = this.cleanText($('h3.jornada').first().text()) || undefined;
    const seenKeys = new Set<string>();

    const matches = $('#divResultados_ table.table.table-bordered.table-striped.table-light > tbody > tr > td > table')
      .toArray()
      .reduce<SourceMatch[]>((result, tableNode) => {
        const table = $(tableNode);

        if (table.find('.wrapper_widget').length === 0 || table.find('.wrapper_widget2').length === 0) {
          return result;
        }

        const mainRow = table.find('tbody > tr').first();
        const cells = mainRow.find('td');

        if (cells.length < 3) {
          return result;
        }

        const homeCell = cells.eq(0);
        const middleCell = cells.eq(1);
        const awayCell = cells.eq(2);

        const homeTeam = this.cleanText(homeCell.find('.font_widgetL a').first().text());
        const awayTeam = this.cleanText(awayCell.find('.font_widgetV a').first().text());

        if (!homeTeam || !awayTeam) {
          return result;
        }

        const actaHref = middleCell.find('a[href*="NFG_CmpPartido"]').first().attr('href');
        const matchUrl = actaHref ? new URL(actaHref, PAGE_CONTEXT_URL).toString() : undefined;
        const codActa = this.parseNumber(actaHref ? this.extractMatch(actaHref, /CodActa=([0-9]+)/i) : undefined);
        const horarios = middleCell
          .find('span.horario')
          .toArray()
          .map((node) => this.cleanText($(node).text()))
          .filter(Boolean);
        const date = horarios[0] || undefined;
        const time = horarios[1] || undefined;
        const resultText = this.extractResultText($, middleCell);
        const status = this.extractStatus(middleCell, Boolean(codActa), Boolean(resultText));
        const venue = this.extractVenueText(table);
        const key = codActa ? `acta:${codActa}` : `${homeTeam}|${awayTeam}|${date}|${time}`;

        if (seenKeys.has(key)) {
          return result;
        }

        seenKeys.add(key);

        result.push({
          homeTeam,
          awayTeam,
          date,
          time,
          result: resultText,
          status,
          url: matchUrl,
          venue,
          visibleContext,
          query: {
            ...baseQuery,
            codActa,
          },
        });

        return result;
      }, []);

    return { matches };
  }

  private extractResultText($: ReturnType<typeof load>, middleCell: Cheerio<AnyNode>): string | undefined {
    const clone = middleCell.clone();

    clone.find('script, .div_icono_resultados, .horario').remove();

    const text = this.cleanText(clone.find('h4 strong').first().text() || clone.text());

    if (!text) {
      return undefined;
    }

    const match = text.match(/(\d+)\s*-\s*(\d+)/);

    if (match) {
      return `${match[1]} - ${match[2]}`;
    }

    if (!text.includes('-')) {
      return undefined;
    }

    const leftScore = text.match(/^\s*(\d+)/)?.[1];
    const allNumbers = Array.from(text.matchAll(/\d+/g)).map((item) => item[0]);
    const rightScore = allNumbers.length > 0 ? allNumbers[allNumbers.length - 1] : undefined;

    if (!leftScore || !rightScore) {
      return undefined;
    }

    return `${leftScore} - ${rightScore}`;
  }

  private extractStatus(middleCell: Cheerio<AnyNode>, hasActa: boolean, hasResult: boolean): string | undefined {
    if (middleCell.find('.wid2_resultado_enjuego').length > 0) {
      return 'in_progress';
    }

    if (middleCell.find('.wid2_resultado_prov').length > 0) {
      return 'provisional';
    }

    if (middleCell.find('.wid2_resultado_cerrada').length > 0 && hasResult) {
      return 'final';
    }

    if (hasActa) {
      return 'played';
    }

    if (middleCell.find('a[title*="Previo no disponible"]').length > 0 || middleCell.text().includes('Previo no disponible')) {
      return 'scheduled';
    }

    // TODO: confirm whether additional match states exist in other Futbol Aragon views.
    return undefined;
  }

  private extractVenueText(table: Cheerio<AnyNode>): string | undefined {
    const metadataRow = table.find('tbody > tr').eq(1);
    const venueText = this.cleanText(metadataRow.find('.font_widgetL').first().text() || metadataRow.text());

    return venueText || undefined;
  }

  private extractPreselectedValue(html: string, elementId: string): string | undefined {
    const escapedId = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`Select_Preselecciona\\(document\\.getElementById\\("${escapedId}"\\),"([^"]+)"\\)`);

    return this.extractMatch(html, pattern);
  }

  private extractMatch(value: string, pattern: RegExp): string | undefined {
    return value.match(pattern)?.[1];
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
