// Orchestrates a sequential batch sync across multiple enabled teams.
import { logger, Logger } from '../../../shared/logger/logger';
import { SyncBatchRunRepository } from '../repositories/sync-batch-run.repository';
import { SourceReferenceRepository } from '../repositories/source-reference.repository';
import { TeamSyncTargetRepository } from '../repositories/team-sync-target.repository';
import { SyncTeamService } from './sync-team.service';
import { SourceReference, SyncTeamsResult, SyncTeamsResultItem, TeamSyncTarget } from '../types/domain.types';

export class SyncTeamsService {
  constructor(
    private readonly teamSyncService: SyncTeamService,
    private readonly teamSyncTargetRepository: TeamSyncTargetRepository,
    private readonly sourceReferenceRepository: SourceReferenceRepository,
    private readonly syncBatchRunRepository: SyncBatchRunRepository,
    private readonly serviceLogger: Logger = logger,
  ) {}

  async execute(): Promise<SyncTeamsResult> {
    const targets = await this.loadOrderedTargets();
    const batchRun = await this.syncBatchRunRepository.start(targets.map((target) => target.internalTeamId));

    this.serviceLogger.info('Starting Futbol Aragon batch sync', {
      batchRunId: batchRun.id,
      totalTargets: targets.length,
    });

    try {
      const results: SyncTeamsResultItem[] = [];

      for (const target of targets) {
        const result = await this.executeTarget(target);

        results.push(result);
      }

      const successCount = results.filter((item) => item.status === 'success').length;
      const partialCount = results.filter((item) => item.status === 'partial_success').length;
      const failedCount = results.filter((item) => item.status === 'failed').length;
      const totalTeams = targets.length;
      const status = this.resolveBatchStatus({
        totalTeams,
        successCount,
        partialCount,
        failedCount,
      });

      await this.syncBatchRunRepository.complete(batchRun.id, {
        status,
        totalTeams,
        successCount,
        partialCount,
        failedCount,
        results,
      });

      return {
        batchRunId: batchRun.id,
        status,
        totalTeams,
        successCount,
        partialCount,
        failedCount,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch sync error';

      await this.syncBatchRunRepository.fail(batchRun.id, errorMessage);

      throw error;
    }
  }

  private async loadOrderedTargets(): Promise<TeamSyncTarget[]> {
    const targets = await this.teamSyncTargetRepository.findEnabled();

    return [...targets].sort((left, right) => {
      const priorityDiff = (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.internalTeamId.localeCompare(right.internalTeamId);
    });
  }

  private async executeTarget(target: TeamSyncTarget): Promise<SyncTeamsResultItem> {
    try {
      const teamReference = await this.resolveTeamReference(target.internalTeamId);
      const sourceTeamSlug = this.resolveSourceTeamSlug(target, teamReference);
      const clubId = target.clubId ?? 'club-spike';

      this.serviceLogger.info('Running Futbol Aragon team sync inside batch', {
        teamId: target.internalTeamId,
        mode: target.mode ?? 'incremental',
        priority: target.priority,
      });

      const result = await this.teamSyncService.execute({
        clubId,
        teamId: target.internalTeamId,
        sourceTeamSlug,
        accessMode: 'public',
        mode: target.mode ?? 'incremental',
      });

      return {
        teamId: target.internalTeamId,
        syncRunId: result.syncRunId,
        status: result.status === 'completed_with_warnings' ? 'partial_success' : 'success',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown team batch sync error';

      this.serviceLogger.error('Futbol Aragon team sync failed inside batch', {
        teamId: target.internalTeamId,
        errorMessage,
      });

      return {
        teamId: target.internalTeamId,
        status: 'failed',
        errorMessage,
      };
    }
  }

  private async resolveTeamReference(internalTeamId: string): Promise<SourceReference> {
    const references = await this.sourceReferenceRepository.findByInternalId(internalTeamId, 'team');
    const futbolAragonReference = references.find((reference) => reference.sourceSystem === 'futbol-aragon') ?? references[0];

    if (!futbolAragonReference) {
      throw new Error(
        `Team source reference not found for internalTeamId=${internalTeamId}. Create the mapping before running batch sync.`,
      );
    }

    return futbolAragonReference;
  }

  private resolveSourceTeamSlug(target: TeamSyncTarget, reference: SourceReference): string {
    if (target.sourceTeamSlug) {
      return target.sourceTeamSlug;
    }

    const metadataSlug = typeof reference.metadata?.sourceTeamSlug === 'string' ? reference.metadata.sourceTeamSlug : undefined;

    if (metadataSlug) {
      return metadataSlug;
    }

    if (typeof reference.sourceId === 'string' && reference.sourceId.trim().length > 0) {
      return reference.sourceId;
    }

    throw new Error(
      `Could not resolve sourceTeamSlug for internalTeamId=${target.internalTeamId}. Configure it in the target or in the team source reference metadata.`,
    );
  }

  private resolveBatchStatus(input: {
    totalTeams: number;
    successCount: number;
    partialCount: number;
    failedCount: number;
  }): SyncTeamsResult['status'] {
    if (input.totalTeams === 0) {
      return 'failed';
    }

    if (input.successCount === input.totalTeams) {
      return 'success';
    }

    if (input.successCount + input.partialCount > 0) {
      return 'partial_success';
    }

    return 'failed';
  }
}
