// Orchestrates the first end-to-end public sync flow for the Futbol Aragon spike with stage-level degradation.
import { createHash } from 'node:crypto';

import { logger, Logger } from '../../../shared/logger/logger';
import {
  CompetitionPageParams,
  StandingsPageParams,
  PublicFutbolAragonClient,
} from '../client/public-client';
import { CalendarsExtractor, ExtractCalendarsResult } from '../extractors/calendars.extractor';
import { CompetitionsExtractor, ExtractCompetitionsResult } from '../extractors/competitions.extractor';
import { ExtractMatchesResult, MatchesExtractor } from '../extractors/matches.extractor';
import { ExtractRoundsResult, RoundsExtractor } from '../extractors/rounds.extractor';
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

    const mode = request.mode ?? 'incremental';
    const syncRun = await this.syncRunRepository.start(request.teamId);
    const issues: SyncRunIssue[] = [];
    const skippedStages: string[] = [];

    try {
      const teamReference = await this.resolveTeamReference(request);
      const entryParams = this.resolveEntryCompetitionParams(teamReference);

      this.serviceLogger.info('Starting Futbol Aragon team sync', {
        syncRunId: syncRun.id,
        internalTeamId: request.teamId,
        sourceTeamSlug: request.sourceTeamSlug,
        sourceReferenceId: teamReference.id,
        mode,
        entryParams,
      });

      if (mode === 'incremental') {
        this.serviceLogger.info('Incremental sync mode enabled', {
          syncRunId: syncRun.id,
          internalTeamId: request.teamId,
        });
      }

      const competitionPage = await this.publicClient.getCompetitionPage(entryParams);
      const competitionPageChange = await this.detectPageChange({
        key: `${request.teamId}-competition-page`,
        pageBody: competitionPage.body,
        mode,
      });

      await this.capturePage({
        issues,
        stage: 'raw-competition-page',
        key: `${request.teamId}-competition-page`,
        entityType: 'competition-page',
        sourceUrl: this.publicClient.buildUrl('/pnfg/NPcd/NFG_CmpJornada', {
          cod_primaria: entryParams.codPrimaria,
          CodCompeticion: entryParams.codCompeticion,
          CodGrupo: entryParams.codGrupo,
          CodTemporada: entryParams.codTemporada,
          CodJornada: entryParams.codJornada,
          ...(entryParams.schCodigoDelegacion !== undefined
            ? { Sch_Codigo_Delegacion: entryParams.schCodigoDelegacion }
            : {}),
        }),
        accessMode: request.accessMode,
        page: competitionPage,
      });

      let extractedCompetitions: ExtractCompetitionsResult = { competitions: [] };
      let extractedCalendars: ExtractCalendarsResult = { calendars: [] };
      let extractedRounds: ExtractRoundsResult = { rounds: [] };
      let extractedMatches: ExtractMatchesResult = { matches: [] };

      if (competitionPageChange.changed) {
        this.serviceLogger.info('Competition page changed, processing extraction', {
          syncRunId: syncRun.id,
          mode,
          previousHash: competitionPageChange.previousHash,
          currentHash: competitionPageChange.currentHash,
        });

        extractedCompetitions = this.competitionsExtractor.extract(competitionPage.body);
        extractedCalendars = this.calendarsExtractor.extract(competitionPage.body);
        extractedRounds = this.roundsExtractor.extract(competitionPage.body);
        extractedMatches = this.matchesExtractor.extract(competitionPage.body);

        this.ensureCoreExtractionIsUsable({
          competitions: extractedCompetitions.competitions.length,
          calendars: extractedCalendars.calendars.length,
          rounds: extractedRounds.rounds.length,
          matches: extractedMatches.matches.length,
        });
      } else {
        skippedStages.push('competition-page-unchanged');
        this.serviceLogger.info('Competition page unchanged, skipping extraction', {
          syncRunId: syncRun.id,
          mode,
          previousHash: competitionPageChange.previousHash,
          currentHash: competitionPageChange.currentHash,
        });
      }

      const standingsParams = this.resolveStandingsParams(
        teamReference,
        extractedCalendars.calendars[0]?.query,
        entryParams,
      );

      let standingsPageChanged = false;
      let standings: ReturnType<StandingNormalizer['normalize']> = [];

      const standingsStage = await this.runWarningStage(issues, 'standings-page', async () => {
        const standingsPage = await this.publicClient.getStandingsPage(standingsParams);
        const standingsPageChange = await this.detectPageChange({
          key: `${request.teamId}-standings-page`,
          pageBody: standingsPage.body,
          mode,
        });

        standingsPageChanged = standingsPageChange.changed;

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

        if (!standingsPageChange.changed) {
          skippedStages.push('standings-page-unchanged');
          this.serviceLogger.info('Standings page unchanged, skipping extraction', {
            syncRunId: syncRun.id,
            mode,
            previousHash: standingsPageChange.previousHash,
            currentHash: standingsPageChange.currentHash,
          });

          return null;
        }

        this.serviceLogger.info('Standings page changed, processing extraction', {
          syncRunId: syncRun.id,
          mode,
          previousHash: standingsPageChange.previousHash,
          currentHash: standingsPageChange.currentHash,
        });

        return this.standingsExtractor.extract(standingsPage.body);
      });

      const seasonLabel = extractedCalendars.calendars[0]?.seasonLabel;
      let competitions: ReturnType<CompetitionNormalizer['normalize']> = [];
      let calendars: ReturnType<CalendarNormalizer['normalize']> = [];
      let rounds: ReturnType<RoundNormalizer['normalize']> = [];
      let matches: ReturnType<MatchNormalizer['normalize']> = [];

      if (competitionPageChange.changed) {
        competitions = this.competitionNormalizer.normalize(extractedCompetitions.competitions, {
          teamId: request.teamId,
          season: seasonLabel,
        });
        calendars = this.calendarNormalizer.normalize(extractedCalendars.calendars, {
          teamId: request.teamId,
        });

        if (calendars.length > 1) {
          issues.push(
            this.createIssue(
              'calendar-selection',
              'warning',
              `Multiple calendars were extracted (${calendars.length}). The sync is using calendars[0] as the reference calendar for related entities.`,
            ),
          );
        }

        rounds = this.roundNormalizer.normalize(extractedRounds.rounds, {
          calendarId: calendars[0]?.id,
        });
        const roundIdBySourceId = new Map(rounds.map((round) => [round.sourceId, round.id]));
        const warnedOrphanRoundSourceIds = new Set<string>();

        matches = this.matchNormalizer.normalize(extractedMatches.matches, {
          roundIdResolver: (item) => {
            const roundSourceId = this.matchNormalizer.buildRoundSourceId(item);
            const roundId = roundIdBySourceId.get(roundSourceId);

            if (roundId) {
              return roundId;
            }

            if (!warnedOrphanRoundSourceIds.has(roundSourceId)) {
              warnedOrphanRoundSourceIds.add(roundSourceId);
              issues.push(
                this.createIssue(
                  'match-round-link',
                  'warning',
                  `No persisted round was found for roundSourceId=${roundSourceId}. The sync will keep a fallback roundId for affected matches.`,
                ),
              );
            }

            return `round-${roundSourceId}`;
          },
        });

        await this.persistStage(issues, 'persist-competitions', () => this.competitionRepository.saveMany(competitions));
        await this.persistStage(issues, 'persist-calendars', () => this.calendarRepository.saveMany(calendars));
        await this.persistStage(issues, 'persist-rounds', () => this.roundRepository.saveMany(rounds));
        await this.persistStage(issues, 'persist-matches', () => this.matchRepository.saveMany(matches));
      }

      if (standingsStage?.standings) {
        standings = this.standingNormalizer.normalize(standingsStage.standings);
        await this.persistStage(issues, 'persist-standings', () => this.standingRepository.saveMany(standings));
      }

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
        competitionPageChanged: competitionPageChange.changed,
        standingsPageChanged,
        competitions: competitions.length,
        calendars: calendars.length,
        rounds: rounds.length,
        matches: matches.length,
        standings: standings.length,
        skippedStages: skippedStages.length > 0 ? skippedStages : undefined,
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

  private async detectPageChange(input: {
    key: string;
    pageBody: string;
    mode: 'full' | 'incremental';
  }): Promise<{
    changed: boolean;
    previousHash?: string;
    currentHash: string;
  }> {
    const currentHash = this.computeContentHash(input.pageBody);

    if (input.mode === 'full') {
      return {
        changed: true,
        currentHash,
      };
    }

    const previousCapture = await this.rawCaptureRepository.findLatestPageByKey(input.key);
    const previousHash = previousCapture?.contentHash;

    if (!previousHash) {
      return {
        changed: true,
        currentHash,
      };
    }

    return {
      changed: previousHash !== currentHash,
      previousHash,
      currentHash,
    };
  }

  private resolveEntryCompetitionParams(teamReference: SourceReference): CompetitionPageParams {
    const navigation = teamReference.navigation?.competitionPage;

    if (!navigation) {
      throw new Error(
        `Team source reference ${teamReference.id ?? teamReference.internalId} is missing navigation.competitionPage metadata required to start sync.`,
      );
    }

    if (navigation.codTemporada === undefined || navigation.codJornada === undefined) {
      throw new Error(
        `Team source reference ${teamReference.id ?? teamReference.internalId} has incomplete navigation.competitionPage metadata. codTemporada and codJornada are required to start sync.`,
      );
    }

    return {
      codPrimaria: navigation.codPrimaria,
      codCompeticion: navigation.codCompeticion,
      codGrupo: navigation.codGrupo,
      codTemporada: navigation.codTemporada,
      codJornada: navigation.codJornada,
    };
  }

  private resolveStandingsParams(
    teamReference: SourceReference,
    calendarQuery: {
      codPrimaria?: number;
      codCompeticion?: number;
      codGrupo?: number;
      codTemporada?: number;
      codJornada?: number;
    } | undefined,
    fallback: CompetitionPageParams,
  ): StandingsPageParams {
    const navigation = teamReference.navigation?.standingsPage;

    return {
      codPrimaria: calendarQuery?.codPrimaria ?? navigation?.codPrimaria ?? fallback.codPrimaria,
      codCompeticion: calendarQuery?.codCompeticion ?? navigation?.codCompeticion ?? fallback.codCompeticion,
      codGrupo: calendarQuery?.codGrupo ?? navigation?.codGrupo ?? fallback.codGrupo,
      codJornada: calendarQuery?.codJornada ?? navigation?.codJornada ?? fallback.codJornada,
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

  private computeContentHash(payload: string): string {
    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  private ensureCoreExtractionIsUsable(summary: {
    competitions: number;
    calendars: number;
    rounds: number;
    matches: number;
  }): void {
    if (summary.calendars === 0) {
      throw new Error('Core extraction did not produce any calendars. The competition page is incomplete or no longer matches the expected HTML.');
    }

    if (summary.rounds === 0) {
      throw new Error('Core extraction did not produce any rounds. The competition page is incomplete or the round selector is no longer being extracted correctly.');
    }

    if (summary.competitions === 0 && summary.matches === 0) {
      throw new Error(
        'Core extraction did not produce competitions or matches. The competition page is likely invalid, incomplete, or structurally changed.',
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
