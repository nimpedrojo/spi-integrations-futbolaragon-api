// Persists normalized standings in MariaDB as snapshot rows, without strong upsert by source identity.
import { prisma } from '../../../shared/prisma/prisma';
import { Standing } from '../types/domain.types';

export class StandingRepository {
  async saveMany(items: Standing[]): Promise<number> {
    const snapshotCapturedAt = items[0]?.capturedAt ?? new Date().toISOString();

    for (const item of items) {
      await prisma.standing.create({
        data: {
          id: item.id,
          sourceId: item.sourceId,
          competitionId: item.competitionId,
          capturedAt: new Date(item.capturedAt ?? snapshotCapturedAt),
          teamName: item.teamName,
          position: item.position,
          points: item.points,
          played: item.played,
          won: item.won,
          drawn: item.drawn,
          lost: item.lost,
          goalsFor: item.goalsFor,
          goalsAgainst: item.goalsAgainst,
          goalDifference: item.goalDifference,
          sourceUrl: item.sourceUrl,
        },
      });
    }

    return items.length;
  }
}
