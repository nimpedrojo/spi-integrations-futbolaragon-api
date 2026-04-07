// Orchestrates the end-to-end flow from source capture to normalized persistence.
import { AuthFutbolAragonClient } from '../client/auth-client';
import { PublicFutbolAragonClient } from '../client/public-client';
import { SessionManager } from '../client/session-manager';
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
import { SyncTeamResult, TeamSyncRequest } from '../types/domain.types';

type ClientGateway = {
  fetchTeamSnapshot: ReturnType<AuthFutbolAragonClient['fetchTeamSnapshot']> extends Promise<infer T>
    ? (context: Parameters<AuthFutbolAragonClient['fetchTeamSnapshot']>[0]) => Promise<T>
    : never;
};

export class SyncTeamService {
  constructor(
    private readonly mapper: TeamSourceMapper,
    private readonly publicClient: PublicFutbolAragonClient,
    private readonly authClient: AuthFutbolAragonClient,
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
  ) {}

  async execute(request: TeamSyncRequest): Promise<SyncTeamResult> {
    const syncRun = await this.syncRunRepository.start(request.teamId);
    const sourceContext = this.mapper.map(request);
    const client = this.resolveClient(request.accessMode);
    const sourceSnapshot = await client.fetchTeamSnapshot(sourceContext);

    await this.rawCaptureRepository.save(syncRun.id, sourceSnapshot);

    const rawCompetitions = this.competitionsExtractor.extract(sourceSnapshot);
    const rawCalendars = this.calendarsExtractor.extract(sourceSnapshot);
    const rawRounds = this.roundsExtractor.extract(sourceSnapshot);
    const rawMatches = this.matchesExtractor.extract(sourceSnapshot);
    const rawStandings = this.standingsExtractor.extract(sourceSnapshot);

    const competitions = this.competitionNormalizer.normalize(rawCompetitions);
    const calendars = this.calendarNormalizer.normalize(rawCalendars);
    const rounds = this.roundNormalizer.normalize(rawRounds);
    const matches = this.matchNormalizer.normalize(rawMatches);
    const standings = this.standingNormalizer.normalize(rawStandings);

    await this.competitionRepository.saveMany(competitions);
    await this.calendarRepository.saveMany(calendars);
    await this.roundRepository.saveMany(rounds);
    await this.matchRepository.saveMany(matches);
    await this.standingRepository.saveMany(standings);

    await this.sourceReferenceRepository.save({
      entity: 'team',
      internalId: request.teamId,
      sourceId: request.sourceTeamSlug,
    });

    const summary = {
      competitions: competitions.length,
      calendars: calendars.length,
      rounds: rounds.length,
      matches: matches.length,
      standings: standings.length,
    };

    await this.syncRunRepository.complete(syncRun.id, summary);

    return {
      syncRunId: syncRun.id,
      accessMode: request.accessMode,
      summary,
    };
  }

  private resolveClient(accessMode: TeamSyncRequest['accessMode']): ClientGateway {
    return accessMode === 'authenticated' ? this.authClient : this.publicClient;
  }
}

export const createSyncTeamService = () =>
  new SyncTeamService(
    new TeamSourceMapper(),
    new PublicFutbolAragonClient(),
    new AuthFutbolAragonClient(new SessionManager()),
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
