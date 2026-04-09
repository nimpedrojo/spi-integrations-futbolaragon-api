// Tracks sync execution lifecycle independently from business entities using Prisma persistence.
import { Prisma, SyncRun as PrismaSyncRun } from '@prisma/client';

import { prisma } from '../../../shared/prisma/prisma';
import { JsonObject, SyncRun, SyncRunIssue, SyncRunSummary } from '../types/domain.types';

export class SyncRunRepository {
  private readonly runs = new Map<string, SyncRun>();

  async start(teamId: string): Promise<SyncRun> {
    const now = new Date();
    const syncRun = await prisma.syncRun.create({
      data: {
        id: `sync-${teamId}-${Date.now()}`,
        teamId,
        sourceSystem: 'futbol-aragon',
        status: 'running',
        startedAt: now,
      },
    });

    const domainRun = this.toDomain(syncRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  async complete(syncRunId: string, summary: SyncRunSummary, issues: SyncRunIssue[] = []): Promise<SyncRun> {
    await this.ensureSyncRunExists(syncRunId);

    const updatedRun = await prisma.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: issues.length > 0 ? 'completed_with_warnings' : 'completed',
        finishedAt: new Date(),
        summary: summary as Prisma.InputJsonValue,
        issues: issues.length > 0 ? (issues as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    const domainRun = this.toDomain(updatedRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  async fail(syncRunId: string, errorMessage: string, issues: SyncRunIssue[] = []): Promise<SyncRun> {
    await this.ensureSyncRunExists(syncRunId);

    const updatedRun = await prisma.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage,
        issues: issues.length > 0 ? (issues as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    const domainRun = this.toDomain(updatedRun);
    this.runs.set(domainRun.id, domainRun);

    return domainRun;
  }

  private async ensureSyncRunExists(syncRunId: string): Promise<void> {
    if (this.runs.has(syncRunId)) {
      return;
    }

    const existingRun = await prisma.syncRun.findUnique({
      where: { id: syncRunId },
    });

    if (!existingRun) {
      throw new Error(`Sync run not found: ${syncRunId}`);
    }

    this.runs.set(syncRunId, this.toDomain(existingRun));
  }

  private toDomain(syncRun: PrismaSyncRun): SyncRun {
    return {
      id: syncRun.id,
      teamId: syncRun.teamId,
      sourceSystem: (syncRun.sourceSystem ?? undefined) as SyncRun['sourceSystem'],
      accessMode: (syncRun.accessMode ?? undefined) as SyncRun['accessMode'],
      status: syncRun.status as SyncRun['status'],
      startedAt: syncRun.startedAt.toISOString(),
      finishedAt: syncRun.finishedAt?.toISOString(),
      summary: this.fromJsonObject(syncRun.summary) as SyncRunSummary | undefined,
      errorMessage: syncRun.errorMessage ?? undefined,
      issues: this.fromJsonArray(syncRun.issues) as SyncRunIssue[] | undefined,
      createdAt: syncRun.createdAt.toISOString(),
      updatedAt: syncRun.updatedAt.toISOString(),
    };
  }

  private fromJsonObject(value: Prisma.JsonValue | null): JsonObject | undefined {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return undefined;
    }

    return value as JsonObject;
  }

  private fromJsonArray(value: Prisma.JsonValue | null): unknown[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    return value;
  }
}
