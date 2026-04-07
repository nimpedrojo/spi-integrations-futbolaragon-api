// Maps the root team entity to source access context and persisted source references.
import { SourceReference, TeamIdentityMapping, TeamSyncRequest } from '../types/domain.types';
import { SourceAccessContext } from '../types/source.types';

export class TeamSourceMapper {
  map(request: TeamSyncRequest): SourceAccessContext {
    return {
      clubId: request.clubId,
      teamId: request.teamId,
      sourceTeamSlug: request.sourceTeamSlug,
      accessMode: request.accessMode,
    };
  }

  buildIdentityMapping(input: {
    internalTeamId: string;
    internalTeamName: string;
    sourceTeamName: string;
    sourceTeamSlug?: string;
    sourceTeamId?: string;
    sourceClubName?: string;
    sourceUrl?: string;
  }): TeamIdentityMapping {
    return {
      sourceSystem: 'futbol-aragon',
      internalTeamId: input.internalTeamId,
      internalTeamName: input.internalTeamName,
      sourceTeamId: input.sourceTeamId,
      sourceTeamName: input.sourceTeamName,
      sourceClubName: input.sourceClubName,
      sourceUrl: input.sourceUrl,
      sourceTeamSlug: input.sourceTeamSlug,
      active: true,
      createdAt: new Date().toISOString(),
    };
  }

  toTeamSourceReference(mapping: TeamIdentityMapping): SourceReference {
    const timestamp = new Date().toISOString();

    return {
      id: `src-ref-team-${mapping.internalTeamId}-${Date.now()}`,
      entity: 'team',
      entityType: 'team',
      sourceSystem: mapping.sourceSystem,
      internalId: mapping.internalTeamId,
      internalName: mapping.internalTeamName,
      sourceId: mapping.sourceTeamId,
      sourceName: mapping.sourceTeamName,
      sourceClubName: mapping.sourceClubName,
      sourceUrl: mapping.sourceUrl,
      metadata: mapping.sourceTeamSlug ? { sourceTeamSlug: mapping.sourceTeamSlug } : undefined,
      createdAt: mapping.createdAt ?? timestamp,
      updatedAt: mapping.updatedAt,
      lastSeenAt: timestamp,
    };
  }
}
