// Persists normalized matches in MariaDB through Prisma using upsert by sourceId.
import { prisma } from '../../../shared/prisma/prisma';
import { Match } from '../types/domain.types';

export class MatchRepository {
  async saveMany(items: Match[]): Promise<number> {
    for (const item of items) {
      await prisma.match.upsert({
        where: {
          sourceId: item.sourceId,
        },
        update: {
          roundId: item.roundId,
          homeTeamName: item.homeTeamName,
          awayTeamName: item.awayTeamName,
          kickoffAt: item.kickoffAt,
          status: item.status,
          result: item.result,
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          venue: item.venue,
          sourceUrl: item.sourceUrl,
        },
        create: {
          id: item.id,
          sourceId: item.sourceId,
          roundId: item.roundId,
          homeTeamName: item.homeTeamName,
          awayTeamName: item.awayTeamName,
          kickoffAt: item.kickoffAt,
          status: item.status,
          result: item.result,
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          venue: item.venue,
          sourceUrl: item.sourceUrl,
        },
      });
    }

    return items.length;
  }
}
