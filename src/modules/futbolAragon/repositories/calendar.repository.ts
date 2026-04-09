// Persists normalized calendars in MariaDB through Prisma using upsert by sourceId.
import { prisma } from '../../../shared/prisma/prisma';
import { Calendar } from '../types/domain.types';

export class CalendarRepository {
  async saveMany(items: Calendar[]): Promise<number> {
    for (const item of items) {
      await prisma.calendar.upsert({
        where: {
          sourceId: item.sourceId,
        },
        update: {
          competitionId: item.competitionId,
          teamId: item.teamId,
          name: item.name,
          seasonLabel: item.seasonLabel,
          visibleContext: item.visibleContext,
        },
        create: {
          id: item.id,
          sourceId: item.sourceId,
          competitionId: item.competitionId,
          teamId: item.teamId,
          name: item.name,
          seasonLabel: item.seasonLabel,
          visibleContext: item.visibleContext,
        },
      });
    }

    return items.length;
  }
}
