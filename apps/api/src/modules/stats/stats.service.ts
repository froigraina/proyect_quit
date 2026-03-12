import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { defaultProfile } from '../shared/defaults';
import { PeriodQueryDto } from '../shared/dto/period-query.dto';
import { buildStats } from '../shared/tracking-rules';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private filterByPeriod<T extends { date: Date | string }>(
    entries: T[],
    query?: PeriodQueryDto,
  ) {
    if (!query?.year || !query.month) {
      return entries;
    }

    return entries.filter((entry) => {
      const date = new Date(entry.date);
      return (
        date.getUTCFullYear() === query.year &&
        date.getUTCMonth() + 1 === query.month
      );
    });
  }

  async summary(userId: string, query?: PeriodQueryDto) {
    if (!process.env.DATABASE_URL) {
      return buildStats(
        this.filterByPeriod(
          [
            {
              date: new Date(Date.UTC(2026, 2, 9)),
              cigarettesSmoked: 0,
              status: 'SUCCESS',
              moneySaved: 1800,
              cigarettesAvoided: 8,
              smokeFreeHours: 24,
            },
            {
              date: new Date(Date.UTC(2026, 2, 10)),
              cigarettesSmoked: 5,
              status: 'USED_FREE_DAY',
              moneySaved: 675,
              cigarettesAvoided: 3,
              smokeFreeHours: 0,
            },
          ],
          query,
        ),
        defaultProfile.monthlyFreeDays,
      );
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    const entries = await this.prisma.dailyEntry.findMany({
      where: {
        profileId: profile?.id,
        date:
          query?.year && query.month
            ? {
                gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
                lt: new Date(Date.UTC(query.year, query.month, 1)),
              }
            : undefined,
      },
      orderBy: { date: 'asc' },
    });

    const summary = buildStats(
      entries,
      profile?.monthlyFreeDays ?? defaultProfile.monthlyFreeDays,
    );

    return {
      ...summary,
      period:
        query?.year && query.month
          ? { year: query.year, month: query.month }
          : null,
      entriesCount: entries.length,
    };
  }
}
