// Defines the source-side contracts kept isolated from the internal domain model.
export type SourceAccessMode = 'public' | 'authenticated';

export type SourceAccessContext = {
  clubId: string;
  teamId: string;
  sourceTeamSlug: string;
  accessMode: SourceAccessMode;
};

export type RawSourceCompetition = {
  sourceId: string;
  teamId: string;
  name: string;
  season: string;
};

export type RawSourceCalendar = {
  sourceId: string;
  competitionSourceId: string;
  teamId: string;
  name: string;
};

export type RawSourceRound = {
  sourceId: string;
  calendarSourceId: string;
  name: string;
  order: number;
};

export type RawSourceMatch = {
  sourceId: string;
  roundSourceId: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  status: 'scheduled';
};

export type RawSourceStanding = {
  sourceId: string;
  competitionSourceId: string;
  teamName: string;
  position: number;
  points: number;
};

export type SourceSnapshot = {
  source: 'futbol-aragon';
  teamSlug: string;
  accessMode: SourceAccessMode;
  capturedAt: string;
  baseUrl: string;
  sessionToken?: string;
  competitions: RawSourceCompetition[];
  calendars: RawSourceCalendar[];
  rounds: RawSourceRound[];
  matches: RawSourceMatch[];
  standings: RawSourceStanding[];
};

type SnapshotSeed = {
  teamSlug: string;
  accessMode: SourceAccessMode;
  baseUrl: string;
  sessionToken?: string;
};

export const createSourceSnapshot = (seed: SnapshotSeed): SourceSnapshot => ({
  source: 'futbol-aragon',
  teamSlug: seed.teamSlug,
  accessMode: seed.accessMode,
  capturedAt: new Date().toISOString(),
  baseUrl: seed.baseUrl,
  sessionToken: seed.sessionToken,
  competitions: [
    {
      sourceId: 'competition-spike',
      teamId: 'team-spike',
      name: 'Competicion Spike',
      season: '2025-2026',
    },
  ],
  calendars: [
    {
      sourceId: 'calendar-spike',
      competitionSourceId: 'competition-spike',
      teamId: 'team-spike',
      name: 'Calendario General',
    },
  ],
  rounds: [
    {
      sourceId: 'round-1',
      calendarSourceId: 'calendar-spike',
      name: 'Jornada 1',
      order: 1,
    },
  ],
  matches: [
    {
      sourceId: 'match-1',
      roundSourceId: 'round-1',
      homeTeamName: 'Equipo Spike',
      awayTeamName: 'Rival Spike',
      kickoffAt: new Date().toISOString(),
      status: 'scheduled',
    },
  ],
  standings: [
    {
      sourceId: 'standing-1',
      competitionSourceId: 'competition-spike',
      teamName: 'Equipo Spike',
      position: 1,
      points: 3,
    },
  ],
});
