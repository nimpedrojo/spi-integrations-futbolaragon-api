// Defines the internal domain contracts consumed by the rest of ProcessIQ.
import { SourceAccessMode } from './source.types';

export type TeamSyncRequest = {
  clubId: string;
  teamId: string;
  sourceTeamSlug: string;
  accessMode: SourceAccessMode;
};

export type Competition = {
  id: string;
  sourceId: string;
  teamId: string;
  name: string;
  season: string;
};

export type Calendar = {
  id: string;
  sourceId: string;
  competitionId: string;
  teamId: string;
  name: string;
};

export type Round = {
  id: string;
  sourceId: string;
  calendarId: string;
  name: string;
  order: number;
};

export type Match = {
  id: string;
  sourceId: string;
  roundId: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  status: 'scheduled';
};

export type Standing = {
  id: string;
  sourceId: string;
  competitionId: string;
  teamName: string;
  position: number;
  points: number;
};

export type SourceReference = {
  entity: 'team';
  internalId: string;
  sourceId: string;
};

export type SyncRunSummary = {
  competitions: number;
  calendars: number;
  rounds: number;
  matches: number;
  standings: number;
};

export type SyncRun = {
  id: string;
  teamId: string;
  status: 'running' | 'completed';
  startedAt: string;
  finishedAt?: string;
  summary?: SyncRunSummary;
};

export type SyncTeamResult = {
  syncRunId: string;
  accessMode: SourceAccessMode;
  summary: SyncRunSummary;
};
