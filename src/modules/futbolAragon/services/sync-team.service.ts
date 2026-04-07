// Orchestrates the first end-to-end public sync flow for the Futbol Aragon spike with stage-level degradation.
import { logger, Logger } from '../../../shared/logger/logger';
import {
  CompetitionPageParams,
  documentedCompetitionPageParams,
  documentedCompetitionPagePath,
  PublicFutbolAragonClient,
} from '../client/public-client';
import { CalendarsExtractor } from '../extractors/calendars.extractor';
import { CompetitionsExtractor } from '../extractors/competitions.extractor';
import { MatchesExtractor } from '../extractors/matches.extractor';
import { RoundsExtractor } from '../extractors/rounds.extractor';
import { StandingsExtractor } from '../extractors/standings.extractor';
import { TeamSourceMapper } from '../mappers/team-source.mapper';
import { CalendarNormalizer } from '../normalizers/calendar.normalizer';
import { CompetitionNormalizer } from '../normalizers/competition.normalizer';
import { MatchNormalizer } from '../normalizers/match.normalizer';
import { RoundNormalizer } from '../normalizers/round.normalizer';
import { StandingNormalizer } from '../normalizers/standing.normalizer';
import { CalendarRepository } from '../repositories/calendar.repository';
import { CompetitionRepository } from '../repositories/competition.repository';
import { MatchRepository } from '../repositories/match.repository';
import { RawCaptureRepository } from '../repositories/raw-capture.repository';
import { RoundRepository } from '../repositories/round.repository';
import { SourceReferenceRepository } from '../repositories/source-reference.repository';
import { StandingRepository } from '../repositories/standing.repository';
import { SyncRunRepository } from '../repositories/sync-run.repository';
import { SourceReference, SyncRunIssue, SyncTeamResult, TeamSyncRequest } from '../types/domain.types';

export class SyncTeamService {
  constructor(
    private readonly mapper: TeamSourceMapper,
    private readonly publicClient: PublicFutbolAragonClient,
    private readonly competitionsExtractor: CompetitionsExtractor,
    private readonly calendarsExtractor: CalendarsExtractor,
    private readonly roundsExtractor: RoundsExtractor,
    private readonly matchesExtractor: MatchesExtractor,
    private readonly standingsExtractor: StandingsExtractor,
    private readonly rawCaptureRepository: RawCaptureRepository,
    private readonly competitionNormalizer: CompetitionNormalizer,
    private readonly calendarNormalizer: CalendarNormalizer,
    private readonly roundNormalizer: RoundNormalizer,
    private readonly matchNormalizer: MatchNormalizer,
    private readonly standingNormalizer: StandingNormalizer,
    private readonly competitionRepository: CompetitionRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly roundRepository: RoundRepository,
    private readonly matchRepository: MatchRepository,
    private readonly standingRepository: StandingRepository,
    private readonly sourceReferenceRepository: SourceReferenceRepository,
    private readonly syncRunRepository: SyncRunRepository,
    private readonly serviceLogger: Logger = logger,
  ) {}

  async execute(request: TeamSyncRequest): Promise<SyncTeamResult> {
    if (request.accessMode !== 'public') {
      throw new Error('Authenticated sync is disabled for this spike. Use the public Futbol Aragon flow.');
    }

    const syncRun = await this.syncRunRepository.start(request.teamId);
    const issues: SyncRunIssue[] = [];

    try {
      const teamReference = await this.resolveTeamReference(request);
      const entryParams = this.resolveEntryCompetitionParams(teamReference);

      this.serviceLogger.info('Starting Futbol Aragon team sync', {
        syncRunId: syncRun.id,
        internalTeamId: request.teamId,
        sourceTeamSlug: request.sourceTeamSlug,
        sourceReferenceId: teamReference.id,
        entryParams,
      });

      const competitionPage = await this.publicClient.getCompetitionPage(entryParams);
      await this.capturePage({
        issues,
        stage: 'raw-competition-page',
        key: `${request.teamId}-competition-page`,
        entityType: 'competition-page',
        sourceUrl: documentedCompetitionPagePath(this.publicClient),
        accessMode: request.accessMode,
        page: competitionPage,
      });

      const extractedCompetitions = this.competitionsExtractor.extract(competitionPage.body);
      const extractedCalendars = this.calendarsExtractor.extract(competitionPage.body);
      const extractedRounds = this.roundsExtractor.extract(competitionPage.body);
      const extractedMatches = this.matchesExtractor.extract(competitionPage.body);

      this.ensureCoreExtractionIsUsable({
        competitions: extractedCompetitions.competitions.length,
        calendars: extractedCalendars.calendars.length,
        rounds: extractedRounds.rounds.length,
        matches: extractedMatches.matches.length,
      });

      const standingsParams = this.resolveStandingsParams(extractedCalendars.calendars[0]?.query, entryParams);
      const standingsStage = await this.runWarningStage(
        issues,
        'standings-page',
        async () => {
          const standingsPage = await this.publicClient.getStandingsPage(standingsParams);
          await this.capturePage({
            issues,
            stage: 'raw-standings-page',
            key: `${request.teamId}-standings-page`,
            entityType: 'standings-page',
            sourceUrl: this.publicClient.buildUrl('/pnfg/NPcd/NFG_VisClasificacion', {
              cod_primaria: standingsParams.codPrimaria,
              codcompeticion: standingsParams.codCompeticion,
              codgrupo: standingsParams.codGrupo,
              codjornada: standingsParams.codJornada,
            }),
            accessMode: request.accessMode,
            page: standingsPage,
          });

          return this.standingsExtractor.extract(standingsPage.body);
        },
      );

      const seasonLabel = extractedCalendars.calendars[0]?.seasonLabel;
      const competitions = this.competitionNormalizer.normalize(extractedCompetitions.competitions, {
        teamId: request.teamId,
        season: seasonLabel,
      });
      const calendars = this.calendarNormalizer.normalize(extractedCalendars.calendars, {
        teamId: request.teamId,
      });
      const rounds = this.roundNormalizer.normalize(extractedRounds.rounds, {
        calendarId: calendars[0]?.id,
      });
      const matches = this.matchNormalizer.normalize(extractedMatches.matches);
      const standings = standingsStage?.standings
        ? this.standingNormalizer.normalize(standingsStage.standings)
        : [];

      await this.persistStage(issues, 'persist-competitions', () => this.competitionRepository.saveMany(competitions));
      await this.persistStage(issues, 'persist-calendars', () => this.calendarRepository.saveMany(calendars));
      await this.persistStage(issues, 'persist-rounds', () => this.roundRepository.saveMany(rounds));
      await this.persistStage(issues, 'persist-matches', () => this.matchRepository.saveMany(matches));
      await this.persistStage(issues, 'persist-standings', () => this.standingRepository.saveMany(standings));
      await this.persistStage(issues, 'persist-team-source-reference', () =>
        this.sourceReferenceRepository.save({
          ...teamReference,
          entity: 'team',
          entityType: 'team',
          internalId: request.teamId,
          sourceSystem: 'futbol-aragon',
          updatedAt: new Date().toISOString(),
        }),
      );

      const summary = {
        competitions: competitions.length,
        calendars: calendars.length,
        rounds: rounds.length,
        matches: matches.length,
        standings: standings.length,
      };

      const completedRun = await this.syncRunRepository.complete(syncRun.id, summary, issues);

      this.serviceLogger.info('Completed Futbol Aragon team sync', {
        syncRunId: syncRun.id,
        status: completedRun.status,
        summary,
        issuesCount: issues.length,
      });

      return {
        syncRunId: syncRun.id,
        accessMode: request.accessMode,
        status: completedRun.status,
        summary,
        issues,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error';
      const fatalIssue = this.createIssue('fatal-sync', 'fatal', message);

      issues.push(fatalIssue);
      await this.syncRunRepository.fail(syncRun.id, message, issues);
      this.serviceLogger.error('Futbol Aragon team sync failed', {
        syncRunId: syncRun.id,
        errorMessage: message,
      });

      throw error;
    }
  }

  private async resolveTeamReference(request: TeamSyncRequest): Promise<SourceReference> {
    const references = await this.sourceReferenceRepository.findByInternalId(request.teamId, 'team');
    const futbolAragonReference = references.find((reference) => reference.sourceSystem === 'futbol-aragon') ?? references[0];

    if (!futbolAragonReference) {
      throw new Error(
        `Team source reference not found for internalTeamId=${request.teamId}. Create the mapping before running sync.`,
      );
    }

    return futbolAragonReference;
  }

  private resolveEntryCompetitionParams(_teamReference: SourceReference): CompetitionPageParams {
    // TODO: replace this documented spike entry point with persisted navigation params once team mapping is enriched.
    return documentedCompetitionPageParams;
  }

  private resolveStandingsParams(
    calendarQuery: {
      codPrimaria?: number;
      codCompeticion?: number;
      codGrupo?: number;
      codTemporada?: number;
      codJornada?: number;
    } | undefined,
    fallback: CompetitionPageParams,
  ) {
    return {
      codPrimaria: calendarQuery?.codPrimaria ?? fallback.codPrimaria,
      codCompeticion: calendarQuery?.codCompeticion ?? fallback.codCompeticion,
      codGrupo: calendarQuery?.codGrupo ?? fallback.codGrupo,
      codJornada: calendarQuery?.codJornada ?? fallback.codJornada,
    };
  }

  private async capturePage(input: {
    issues: SyncRunIssue[];
    stage: string;
    key: string;
    entityType: 'competition-page' | 'standings-page';
    sourceUrl: string;
    accessMode: TeamSyncRequest['accessMode'];
    page: {
      url: string;
      statusCode: number;
      body: string;
      headers: Record<string, string | string[] | undefined>;
      durationMs: number;
    };
  }): Promise<void> {
    await this.runWarningStage(input.issues, input.stage, () =>
      this.rawCaptureRepository.savePage({
        key: input.key,
        entityType: input.entityType,
        sourceUrl: input.sourceUrl,
        accessMode: input.accessMode,
        page: input.page,
      }),
    );
  }

  private async persistStage(
    issues: SyncRunIssue[],
    stage: string,
    action: () => Promise<unknown>,
  ): Promise<void> {
    await this.runWarningStage(issues, stage, action);
  }

  private async runWarningStage<T>(
    issues: SyncRunIssue[],
    stage: string,
    action: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown stage error';
      const issue = this.createIssue(stage, 'warning', message);

      issues.push(issue);
      this.serviceLogger.error('Futbol Aragon sync stage degraded', {
        stage,
        errorMessage: message,
      });

      return null;
    }
  }

  private createIssue(stage: string, severity: SyncRunIssue['severity'], message: string): SyncRunIssue {
    return {
      stage,
      severity,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  private ensureCoreExtractionIsUsable(summary: {
    competitions: number;
    calendars: number;
    rounds: number;
    matches: number;
  }): void {
    if (summary.competitions === 0 && summary.calendars === 0 && summary.rounds === 0 && summary.matches === 0) {
      throw new Error(
        'Core extraction returned no usable data from the competition page. The source HTML is likely invalid or incomplete.',
      );
    }
  }
}

export const createSyncTeamService = () =>
  new SyncTeamService(
    new TeamSourceMapper(),
    new PublicFutbolAragonClient(),
    new CompetitionsExtractor(),
    new CalendarsExtractor(),
    new RoundsExtractor(),
    new MatchesExtractor(),
    new StandingsExtractor(),
    new RawCaptureRepository(),
    new CompetitionNormalizer(),
    new CalendarNormalizer(),
    new RoundNormalizer(),
    new MatchNormalizer(),
    new StandingNormalizer(),
    new CompetitionRepository(),
    new CalendarRepository(),
    new RoundRepository(),
    new MatchRepository(),
    new StandingRepository(),
    new SourceReferenceRepository(),
    new SyncRunRepository(),
  );
