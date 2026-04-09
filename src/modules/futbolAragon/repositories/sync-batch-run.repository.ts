// Tracks multi-team batch execution lifecycle using Prisma persistence.
import { Prisma, SyncBatchRun as PrismaSyncBatchRun } from '@prisma/client';

import { prisma } from '../../../shared/prisma/prisma';
import { SyncBatchRun, SyncBatchRunStatus, SyncTeamsResultItem } from '../types/domain.types';

export class SyncBatchRunRepository {
  private readonly runs = new Map<string, SyncBatchRun>();

  async start(teamIds: string[]): Promise<SyncBatchRun> {
    const now = new Date();
    const syncBatchRun = await prisma.syncBatchRun.create({
      data: {
        id: `sync-batch-${Date.now()}`,
        startedAt: now,
        status: 'running',
        totalTeams: teamIds.length,
        successCount: 0,
        partialCount: 0,
        failedCount: 0,
        teamIds: teamIds as Prisma.InputJsonValue,
      },
    });

    const domainRun = this.toDomain(syncBatchRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  async complete(
    batchRunId: string,
    input: {
      status: SyncBatchRunStatus;
      totalTeams: number;
      successCount: number;
      partialCount: number;
      failedCount: number;
      results: SyncTeamsResultItem[];
    },
  ): Promise<SyncBatchRun> {
    await this.ensureSyncBatchRunExists(batchRunId);

    const updatedRun = await prisma.syncBatchRun.update({
      where: { id: batchRunId },
      data: {
        status: input.status,
        finishedAt: new Date(),
        totalTeams: input.totalTeams,
        successCount: input.successCount,
        partialCount: input.partialCount,
        failedCount: input.failedCount,
        summary: {
          results: input.results,
        } as Prisma.InputJsonValue,
      },
    });

    const domainRun = this.toDomain(updatedRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  async fail(batchRunId: string, errorMessage: string): Promise<SyncBatchRun> {
    await this.ensureSyncBatchRunExists(batchRunId);

    const updatedRun = await prisma.syncBatchRun.update({
      where: { id: batchRunId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage,
      },
    });

    const domainRun = this.toDomain(updatedRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  private async ensureSyncBatchRunExists(batchRunId: string): Promise<void> {
    if (this.runs.has(batchRunId)) {
      return;
    }

    const existingRun = await prisma.syncBatchRun.findUnique({
      where: { id: batchRunId },
    });

    if (!existingRun) {
      throw new Error(`Sync batch run not found: ${batchRunId}`);
    }

    this.runs.set(batchRunId, this.toDomain(existingRun));
  }

  private toDomain(syncBatchRun: PrismaSyncBatchRun): SyncBatchRun {
    return {
      id: syncBatchRun.id,
      startedAt: syncBatchRun.startedAt.toISOString(),
      finishedAt: syncBatchRun.finishedAt?.toISOString(),
      status: syncBatchRun.status as SyncBatchRun['status'],
      totalTeams: syncBatchRun.totalTeams,
      successCount: syncBatchRun.successCount,
      partialCount: syncBatchRun.partialCount,
      failedCount: syncBatchRun.failedCount,
      teamIds: this.fromJsonArray(syncBatchRun.teamIds) as string[],
      summary: this.fromSummary(syncBatchRun.summary),
      errorMessage: syncBatchRun.errorMessage ?? undefined,
      createdAt: syncBatchRun.createdAt.toISOString(),
      updatedAt: syncBatchRun.updatedAt.toISOString(),
    };
  }

  private fromJsonArray(value: Prisma.JsonValue | null): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private fromSummary(value: Prisma.JsonValue | null): SyncBatchRun['summary'] | undefined {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return undefined;
    }

    const results = (value as { results?: unknown }).results;

    if (!Array.isArray(results)) {
      return undefined;
    }

    return {
      results: results as SyncTeamsResultItem[],
    };
  }
}
