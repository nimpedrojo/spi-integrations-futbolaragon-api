// Persists normalized competitions in MariaDB through Prisma using upsert by sourceId.
import { prisma } from '../../../shared/prisma/prisma';
import { Competition } from '../types/domain.types';

export class CompetitionRepository {
  async saveMany(items: Competition[]): Promise<number> {
    for (const item of items) {
      await prisma.competition.upsert({
        where: {
          sourceId: item.sourceId,
        },
        update: {
          teamId: item.teamId,
          name: item.name,
          season: item.season,
          sourceSystem: item.sourceSystem,
          externalCode: item.externalCode,
          groupName: item.groupName,
          status: item.status,
        },
        create: {
          id: item.id,
          sourceId: item.sourceId,
          teamId: item.teamId,
          name: item.name,
          season: item.season,
          sourceSystem: item.sourceSystem,
          externalCode: item.externalCode,
          groupName: item.groupName,
          status: item.status,
        },
      });
    }

    return items.length;
  }
}
