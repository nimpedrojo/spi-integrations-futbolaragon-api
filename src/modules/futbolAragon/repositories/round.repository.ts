// Persists normalized rounds in MariaDB through Prisma using upsert by sourceId.
import { prisma } from '../../../shared/prisma/prisma';
import { Round } from '../types/domain.types';

export class RoundRepository {
  async saveMany(items: Round[]): Promise<number> {
    for (const item of items) {
      await prisma.round.upsert({
        where: {
          sourceId: item.sourceId,
        },
        update: {
          calendarId: item.calendarId,
          name: item.name,
          roundOrder: item.roundOrder,
          number: item.number,
          dateLabel: item.dateLabel,
          status: item.status,
        },
        create: {
          id: item.id,
          sourceId: item.sourceId,
          calendarId: item.calendarId,
          name: item.name,
          roundOrder: item.roundOrder,
          number: item.number,
          dateLabel: item.dateLabel,
          status: item.status,
        },
      });
    }

    return items.length;
  }
}
