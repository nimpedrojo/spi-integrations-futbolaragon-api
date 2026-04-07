// Extracts standings rows from public Futbol Aragon HTML without applying domain normalization.
import { Cheerio, load } from 'cheerio';
import type { AnyNode } from 'domhandler';

import { RawSourceStanding, SourceSnapshot } from '../types/source.types';

export type SourceStandingRow = {
  position: number;
  teamName: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  url?: string;
  recentForm?: string[];
  visibleContext?: string;
  query: {
    codPrimaria?: number;
    codCompeticion?: number;
    codGrupo?: number;
    codTemporada?: number;
    codJornada?: number;
    codigoEquipo?: number;
  };
};

export type ExtractStandingsResult = {
  standings: SourceStandingRow[];
  competitionName?: string;
  seasonLabel?: string;
  groupName?: string;
  visibleContext?: string;
  sourceView: 'detail' | 'summary' | 'unknown';
};

const DEFAULT_BASE_URL = 'https://www.futbolaragon.com';
const PAGE_CONTEXT_URL = `${DEFAULT_BASE_URL}/pnfg/NPcd/NFG_VisClasificacion`;

export class StandingsExtractor {
  extract(html: string): ExtractStandingsResult;
  extract(snapshot: SourceSnapshot): RawSourceStanding[];
  extract(input: string | SourceSnapshot): ExtractStandingsResult | RawSourceStanding[] {
    if (typeof input !== 'string') {
      // TODO: remove this compatibility path when the sync flow starts storing and extracting real HTML.
      return input.standings;
    }

    const $ = load(input);
    const baseQuery = {
      codPrimaria: this.parseNumber(this.extractMatch(input, /cod_primaria=([0-9]+)/i)),
      codCompeticion: this.parseNumber(this.extractMatch(input, /codcompeticion=([0-9]+)/i)),
      codGrupo: this.parseNumber(this.extractMatch(input, /codgrupo=([0-9]+)/i)),
      codTemporada: this.parseNumber(this.extractMatch(input, /codtemporada=([0-9]+)/i) ?? this.extractMatch(input, /CodTemporada=([0-9]+)/i)),
      codJornada: this.parseNumber(this.extractMatch(input, /codjornada=([0-9]+)/i) ?? this.extractMatch(input, /CodJornada=([0-9]+)/i)),
    };
    const competitionName = this.cleanText($('h4.la_roja_regular_titulo1').first().text()) || undefined;
    const seasonLabel = this.cleanText($('h4.la_roja_regular_titulo2').first().text()) || undefined;
    const groupName = this.cleanText($('.row h5').first().text()) || undefined;
    const visibleContext = [competitionName, seasonLabel, groupName].filter(Boolean).join(' · ') || undefined;
    const sourceView = this.detectSourceView($);
    const table = this.findStandingsTable($, sourceView);

    if (!table || table.length === 0) {
      return {
        standings: [],
        competitionName,
        seasonLabel,
        groupName,
        visibleContext,
        sourceView,
      };
    }

    const seenKeys = new Set<string>();
    const standings = table
      .find('tr')
      .toArray()
      .reduce<SourceStandingRow[]>((result, row) => {
        const cells = $(row).find('td');

        if (cells.length < 8) {
          return result;
        }

        const position = this.parseNumber(this.cleanText(cells.eq(1).text()));
        const teamCell = cells.eq(2);
        const teamName = this.cleanText(teamCell.text());

        if (!position || !teamName) {
          return result;
        }

        const teamHref = teamCell.find('a').first().attr('href');
        const teamUrl = teamHref ? new URL(teamHref, PAGE_CONTEXT_URL).toString() : undefined;
        const codigoEquipo = this.parseNumber(teamHref ? this.extractMatch(teamHref, /codequipo=([0-9]+)/i) : undefined);
        const metrics = this.extractMetrics(cells, sourceView);
        const key = codigoEquipo ? `team:${codigoEquipo}` : `${position}:${teamName}`;

        if (seenKeys.has(key)) {
          return result;
        }

        seenKeys.add(key);

        result.push({
          position,
          teamName,
          points: metrics.points,
          played: metrics.played,
          won: metrics.won,
          drawn: metrics.drawn,
          lost: metrics.lost,
          goalsFor: metrics.goalsFor,
          goalsAgainst: metrics.goalsAgainst,
          url: teamUrl,
          recentForm: metrics.recentForm,
          visibleContext,
          query: {
            ...baseQuery,
            codigoEquipo,
          },
        });

        return result;
      }, []);

    return {
      standings,
      competitionName,
      seasonLabel,
      groupName,
      visibleContext,
      sourceView,
    };
  }

  private detectSourceView($: ReturnType<typeof load>): ExtractStandingsResult['sourceView'] {
    if ($('#CL_Detalle table').length > 0) {
      return 'detail';
    }

    if ($('#CL_Resumen table').length > 0) {
      return 'summary';
    }

    return 'unknown';
  }

  private findStandingsTable(
    $: ReturnType<typeof load>,
    sourceView: ExtractStandingsResult['sourceView'],
  ) {
    const scopes = sourceView === 'summary'
      ? ['#CL_Resumen']
      : sourceView === 'detail'
        ? ['#CL_Detalle', '#CL_Resumen']
        : ['#CL_Detalle', '#CL_Resumen', 'body'];

    for (const scope of scopes) {
      const candidate = $(`${scope} table`)
        .toArray()
        .map((node) => $(node))
        .find((table) => {
          const text = this.cleanText(table.text());

          return text.includes('Ordenar por') && text.includes('Puntos') && text.includes('Equipos');
        });

      if (candidate && candidate.length > 0) {
        return candidate;
      }
    }

    return undefined;
  }

  private extractMetrics(cells: Cheerio<AnyNode>, sourceView: ExtractStandingsResult['sourceView']) {
    const points = this.parseNumber(this.cleanText(cells.eq(3).text()));
    const recentForm = this.extractRecentForm(cells.eq(sourceView === 'detail' ? 14 : 8).text());

    if (sourceView === 'summary') {
      return {
        points,
        played: this.parseNumber(this.cleanText(cells.eq(4).text())),
        won: this.parseNumber(this.cleanText(cells.eq(5).text())),
        drawn: this.parseNumber(this.cleanText(cells.eq(6).text())),
        lost: this.parseNumber(this.cleanText(cells.eq(7).text())),
        goalsFor: undefined,
        goalsAgainst: undefined,
        recentForm,
      };
    }

    const homePlayed = this.parseNumber(this.cleanText(cells.eq(4).text())) ?? 0;
    const homeWon = this.parseNumber(this.cleanText(cells.eq(5).text())) ?? 0;
    const homeDrawn = this.parseNumber(this.cleanText(cells.eq(6).text())) ?? 0;
    const homeLost = this.parseNumber(this.cleanText(cells.eq(7).text())) ?? 0;
    const awayPlayed = this.parseNumber(this.cleanText(cells.eq(8).text())) ?? 0;
    const awayWon = this.parseNumber(this.cleanText(cells.eq(9).text())) ?? 0;
    const awayDrawn = this.parseNumber(this.cleanText(cells.eq(10).text())) ?? 0;
    const awayLost = this.parseNumber(this.cleanText(cells.eq(11).text())) ?? 0;

    return {
      points,
      played: homePlayed + awayPlayed,
      won: homeWon + awayWon,
      drawn: homeDrawn + awayDrawn,
      lost: homeLost + awayLost,
      goalsFor: this.parseNumber(this.cleanText(cells.eq(12).text())),
      goalsAgainst: this.parseNumber(this.cleanText(cells.eq(13).text())),
      recentForm,
    };
  }

  private extractRecentForm(value?: string): string[] | undefined {
    const form = (value ?? '').match(/[GEP]/g) ?? [];

    return form.length > 0 ? form : undefined;
  }

  private extractMatch(value: string, pattern: RegExp): string | undefined {
    return value.match(pattern)?.[1];
  }

  private parseNumber(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private cleanText(value?: string): string {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }
}
