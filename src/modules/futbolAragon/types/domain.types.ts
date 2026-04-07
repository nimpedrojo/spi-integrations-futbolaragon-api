// Defines the normalized internal model used by the spike without depending on ProcessIQ Core.
import { SourceAccessMode, SourceSystem } from './source.types';

export type TeamSyncRequest = {
  clubId: string;
  teamId: string;
  sourceTeamSlug: string;
  accessMode: SourceAccessMode;
};

export type TeamIdentityMapping = {
  sourceSystem: SourceSystem;
  internalTeamId: string;
  internalTeamName: string;
  sourceTeamId?: string;
  sourceTeamName: string;
  sourceClubName?: string;
  sourceUrl?: string;
  sourceTeamSlug?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NormalizedEntityType =
  | 'team'
  | 'competition'
  | 'calendar'
  | 'round'
  | 'match'
  | 'standing';

export type SyncRunStatus = 'running' | 'completed' | 'completed_with_warnings' | 'failed';

export type SyncRunIssue = {
  stage: string;
  severity: 'warning' | 'fatal';
  message: string;
  timestamp: string;
};

export type BaseNormalizedEntity = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Team = BaseNormalizedEntity & {
  id: string;
  clubId: string;
  name?: string;
  slug?: string;
  season?: string;
  active: boolean;
};

export type Competition = BaseNormalizedEntity & {
  id: string;
  sourceId: string;
  teamId: string;
  name: string;
  season: string;
  sourceSystem?: SourceSystem;
  externalCode?: string;
  groupName?: string;
  status?: 'active' | 'inactive';
};

export type Calendar = BaseNormalizedEntity & {
  id: string;
  sourceId: string;
  competitionId: string;
  teamId: string;
  name: string;
  seasonLabel?: string;
  visibleContext?: string;
};

export type Round = BaseNormalizedEntity & {
  id: string;
  sourceId: string;
  calendarId: string;
  name: string;
  order: number;
  number?: number;
  dateLabel?: string;
  status?: 'scheduled' | 'in_progress' | 'completed';
};

export type Match = BaseNormalizedEntity & {
  id: string;
  sourceId: string;
  roundId: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  status: 'scheduled' | 'in_progress' | 'played' | 'final' | 'provisional';
  result?: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  sourceUrl?: string;
};

export type Standing = BaseNormalizedEntity & {
  id: string;
  sourceId: string;
  competitionId: string;
  teamName: string;
  position: number;
  points: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  sourceUrl?: string;
};

export type SourceReference = BaseNormalizedEntity & {
  entity: NormalizedEntityType;
  entityType?: NormalizedEntityType;
  internalId: string;
  internalName?: string;
  sourceId?: string;
  sourceName?: string;
  sourceClubName?: string;
  sourceSystem?: SourceSystem;
  sourceEntityType?: string;
  sourceUrl?: string;
  notes?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt?: string;
  updatedAt?: string;
  lastSeenAt?: string;
};

export type SyncRunSummary = {
  competitions: number;
  calendars: number;
  rounds: number;
  matches: number;
  standings: number;
};

export type SyncRun = BaseNormalizedEntity & {
  id: string;
  teamId: string;
  sourceSystem?: SourceSystem;
  accessMode?: SourceAccessMode;
  status: SyncRunStatus;
  startedAt: string;
  finishedAt?: string;
  summary?: SyncRunSummary;
  errorMessage?: string;
  issues?: SyncRunIssue[];
};

export type SyncTeamResult = {
  syncRunId: string;
  accessMode: SourceAccessMode;
  status?: SyncRunStatus;
  summary: SyncRunSummary;
  issues?: SyncRunIssue[];
};
