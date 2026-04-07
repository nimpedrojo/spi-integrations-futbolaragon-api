// Encapsulates reusable public HTML fetching for Futbol Aragon.
import { env } from '../../../config/env';
import { logger, Logger } from '../../../shared/logger/logger';
import { FetchHttpClient } from '../../../shared/http/fetch-http-client';
import { createSourceSnapshot } from '../types/source.types';
import { SourceAccessContext, SourceSnapshot } from '../types/source.types';

export type FetchPageResult = {
  url: string;
  statusCode: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
  durationMs: number;
};

export type PublicFutbolAragonClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  maxRedirects?: number;
  defaultHeaders?: Record<string, string>;
  logger?: Logger;
};

export type FutbolAragonQueryValue = string | number;

export type FutbolAragonQuery = Record<string, FutbolAragonQueryValue>;

export type CompetitionPageParams = {
  codPrimaria: string | number;
  codCompeticion: string | number;
  codGrupo: string | number;
  codTemporada: string | number;
  codJornada: string | number;
  schCodigoDelegacion?: string | number;
};

export type CalendarPageParams = {
  codPrimaria: string | number;
  codTemporada: string | number;
  codCompeticion: string | number;
  codGrupo: string | number;
  codJornada: string | number;
};

export type RoundPageParams = CompetitionPageParams;

export type MatchPageParams = {
  codPrimaria: string | number;
  codActa: string | number;
};

export type StandingsPageParams = {
  codPrimaria: string | number;
  codCompeticion: string | number;
  codGrupo: string | number;
  codJornada: string | number;
};

export class PublicFutbolAragonClient {
  private readonly httpClient: FetchHttpClient;
  private readonly logger: Logger;
  private readonly baseUrl: string;

  constructor(options: PublicFutbolAragonClientOptions = {}) {
    this.logger = options.logger ?? logger;
    this.baseUrl = options.baseUrl ?? env.fafBaseUrl;
    this.httpClient = new FetchHttpClient({
      baseUrl: this.baseUrl,
      timeoutMs: options.timeoutMs ?? env.fafTimeoutMs,
      maxRetries: options.maxRetries ?? env.fafMaxRetries,
      maxRedirects: options.maxRedirects ?? 5,
      defaultHeaders: {
        'user-agent': env.fafUserAgent,
        accept: 'text/html,application/xhtml+xml',
        ...options.defaultHeaders,
      },
      logger: this.logger,
    });
  }

  buildUrl(path: string, query?: FutbolAragonQuery): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  async fetchPage(pathOrUrl: string): Promise<FetchPageResult> {
    const requestedUrl = this.normalizePathOrUrl(pathOrUrl);

    this.logger.info('Requesting Futbol Aragon page', {
      pathOrUrl,
      url: requestedUrl,
    });

    const result = await this.httpClient.request<string>({
      method: 'GET',
      pathOrUrl: requestedUrl,
    });

    this.logger.info('Fetched Futbol Aragon page', {
      url: result.url,
      statusCode: result.statusCode,
      durationMs: result.durationMs,
    });

    return result;
  }

  async getCompetitionPage(params: CompetitionPageParams): Promise<FetchPageResult> {
    const url = this.buildUrl('/pnfg/NPcd/NFG_CmpJornada', {
      cod_primaria: params.codPrimaria,
      CodCompeticion: params.codCompeticion,
      CodGrupo: params.codGrupo,
      CodTemporada: params.codTemporada,
      CodJornada: params.codJornada,
      ...(params.schCodigoDelegacion !== undefined
        ? { Sch_Codigo_Delegacion: params.schCodigoDelegacion }
        : {}),
    });

    this.logger.info('Requesting competition page', { params, url });

    return this.fetchPage(url);
  }

  async getCalendarPage(params: CalendarPageParams): Promise<FetchPageResult> {
    const url = this.buildUrl('/pnfg/NPcd/NFG_VisCalendario_Vis', {
      cod_primaria: params.codPrimaria,
      codtemporada: params.codTemporada,
      codcompeticion: params.codCompeticion,
      codgrupo: params.codGrupo,
      CodJornada: params.codJornada,
    });

    this.logger.info('Requesting calendar page', { params, url });

    return this.fetchPage(url);
  }

  async getRoundPage(params: RoundPageParams): Promise<FetchPageResult> {
    this.logger.info('Requesting round page through competition view', { params });

    return this.getCompetitionPage(params);
  }

  async getMatchPage(params: MatchPageParams): Promise<FetchPageResult> {
    const url = this.buildUrl('/pnfg/NPcd/NFG_CmpPartido', {
      cod_primaria: params.codPrimaria,
      CodActa: params.codActa,
      cod_acta: params.codActa,
    });

    this.logger.info('Requesting match page', { params, url });

    return this.fetchPage(url);
  }

  async getStandingsPage(params: StandingsPageParams): Promise<FetchPageResult> {
    const url = this.buildUrl('/pnfg/NPcd/NFG_VisClasificacion', {
      cod_primaria: params.codPrimaria,
      codcompeticion: params.codCompeticion,
      codgrupo: params.codGrupo,
      codjornada: params.codJornada,
    });

    this.logger.info('Requesting standings page', { params, url });

    return this.fetchPage(url);
  }

  async fetchTeamSnapshot(context: SourceAccessContext): Promise<SourceSnapshot> {
    this.logger.info('Building placeholder team snapshot from public source context', {
      teamSlug: context.sourceTeamSlug,
    });

    return createSourceSnapshot({
      teamSlug: context.sourceTeamSlug,
      accessMode: 'public',
      baseUrl: env.fafBaseUrl,
    });
  }

  private normalizePathOrUrl(pathOrUrl: string): string {
    return new URL(pathOrUrl, this.baseUrl).toString();
  }
}

// Example helper to manually test connectivity without adding extractor logic yet.
export const fetchPublicPageExample = async (pathOrUrl: string) => {
  const client = new PublicFutbolAragonClient();

  return client.fetchPage(pathOrUrl);
};

// Centralized documented example used for manual raw capture during the spike.
export const documentedCompetitionPageParams: CompetitionPageParams = {
  codPrimaria: 1000120,
  codCompeticion: 23108488,
  codGrupo: 23108496,
  codTemporada: 21,
  codJornada: 8,
  schCodigoDelegacion: 1,
};

// Centralized documented example used for manual raw capture during the spike.
export const documentedCompetitionPagePath = (client = new PublicFutbolAragonClient()) =>
  client.buildUrl('/pnfg/NPcd/NFG_CmpJornada', {
    cod_primaria: documentedCompetitionPageParams.codPrimaria,
    CodCompeticion: documentedCompetitionPageParams.codCompeticion,
    CodGrupo: documentedCompetitionPageParams.codGrupo,
    CodTemporada: documentedCompetitionPageParams.codTemporada,
    CodJornada: documentedCompetitionPageParams.codJornada,
    Sch_Codigo_Delegacion: documentedCompetitionPageParams.schCodigoDelegacion ?? 1,
  });
