// Defines the normalized internal model used by the spike without depending on ProcessIQ Core.
import { SourceAccessMode, SourceSystem } from './source.types';

export type TeamSyncRequest = {
  clubId: string;
  teamId: string;
  sourceTeamSlug: string;
  accessMode: SourceAccessMode;
  mode?: 'full' | 'incremental';
};

export type TeamSyncTarget = {
  internalTeamId: string;
  enabled: boolean;
  mode?: 'full' | 'incremental';
  priority?: number;
  notes?: string;
  clubId?: string;
  sourceTeamSlug?: string;
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
  navigation?: SourceReferenceNavigation;
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
export type SyncBatchRunStatus = 'running' | 'success' | 'partial_success' | 'failed';

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
  roundOrder: number;
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
  capturedAt?: string;
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

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

export type SourceReferenceNavigationContext = {
  codPrimaria: number;
  codCompeticion: number;
  codGrupo: number;
  codTemporada?: number;
  codJornada?: number;
};

export type SourceReferenceStandingsNavigationContext = {
  codPrimaria: number;
  codCompeticion: number;
  codGrupo: number;
  codJornada?: number;
};

export type SourceReferenceNavigation = {
  competitionPage?: SourceReferenceNavigationContext;
  standingsPage?: SourceReferenceStandingsNavigationContext;
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
  navigation?: SourceReferenceNavigation;
  notes?: string;
  metadata?: JsonObject;
  createdAt?: string;
  updatedAt?: string;
  lastSeenAt?: string;
};

export type SyncRunSummary = {
  competitionPageChanged: boolean;
  standingsPageChanged: boolean;
  competitions: number;
  calendars: number;
  rounds: number;
  matches: number;
  standings: number;
  skippedStages?: string[];
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

export type SyncTeamsResultItem = {
  teamId: string;
  syncRunId?: string;
  status: 'success' | 'partial_success' | 'failed';
  errorMessage?: string;
};

export type SyncTeamsResult = {
  batchRunId: string;
  status: 'success' | 'partial_success' | 'failed';
  totalTeams: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  results: SyncTeamsResultItem[];
};

export type SyncBatchRun = BaseNormalizedEntity & {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: SyncBatchRunStatus;
  totalTeams: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  teamIds: string[];
  summary?: {
    results: SyncTeamsResultItem[];
  };
  errorMessage?: string;
};
