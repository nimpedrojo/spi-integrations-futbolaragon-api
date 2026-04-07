// Maps the root team entity to the source access context used by the clients.
import { TeamSyncRequest } from '../types/domain.types';
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
}
