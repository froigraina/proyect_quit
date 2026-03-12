import { Injectable } from '@nestjs/common';
import { AchievementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultAchievements } from '../shared/defaults';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statsService: StatsService,
  ) {}

  private metricForType(
    type: AchievementType,
    stats: Awaited<ReturnType<StatsService['summary']>>,
  ) {
    switch (type) {
      case AchievementType.SMOKE_FREE_DAYS:
        return stats.smokeFreeDays;
      case AchievementType.STREAK:
        return stats.bestStreak;
      case AchievementType.MONEY_SAVED:
        return stats.moneySaved;
      case AchievementType.CIGARETTES_AVOIDED:
        return stats.cigarettesAvoided;
      default:
        return 0;
    }
  }

  async list(userId: string) {
    const stats = await this.statsService.summary(userId);

    if (!process.env.DATABASE_URL) {
      return defaultAchievements.map((achievement) => ({
        ...achievement,
        unlocked:
          this.metricForType(achievement.type, stats) >= achievement.threshold,
      }));
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return [];
    }

    for (const achievement of defaultAchievements) {
      await this.prisma.achievement.upsert({
        where: { key: achievement.key },
        update: achievement,
        create: achievement,
      });
    }

    const achievements = await this.prisma.achievement.findMany({
      include: {
        unlockedBy: {
          where: { profileId: profile.id },
        },
      },
      orderBy: { threshold: 'asc' },
    });

    for (const achievement of achievements) {
      const unlocked =
        this.metricForType(achievement.type, stats) >= achievement.threshold;
      if (unlocked) {
        await this.prisma.unlockedAchievement.upsert({
          where: {
            achievementId_profileId: {
              achievementId: achievement.id,
              profileId: profile.id,
            },
          },
          update: {},
          create: {
            achievementId: achievement.id,
            profileId: profile.id,
          },
        });
      }
    }

    const withUnlocks = await this.prisma.achievement.findMany({
      include: {
        unlockedBy: {
          where: { profileId: profile.id },
        },
      },
      orderBy: { threshold: 'asc' },
    });

    return withUnlocks.map((achievement) => ({
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      unlocked: achievement.unlockedBy.length > 0,
      threshold: achievement.threshold,
      type: achievement.type,
    }));
  }
}
