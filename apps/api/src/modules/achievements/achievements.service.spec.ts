import { AchievementType } from '@prisma/client';
import { defaultAchievements } from '../shared/defaults';
import { AchievementsService } from './achievements.service';

describe('AchievementsService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    jest.clearAllMocks();
  });

  it('evaluates unlocks in fallback mode from current stats', async () => {
    delete process.env.DATABASE_URL;

    const service = new AchievementsService(
      {} as never,
      {
        summary: jest.fn().mockResolvedValue({
          smokeFreeDays: 3,
          moneySaved: 12000,
          cigarettesAvoided: 110,
          smokeFreeHours: 24,
          currentStreak: 3,
          bestStreak: 7,
          monthlyFreeDaysRemaining: 2,
        }),
      } as never,
    );

    const achievements = await service.list('user-1');

    expect(achievements).toHaveLength(defaultAchievements.length);
    expect(
      achievements.find((achievement) => achievement.key === 'seven-day-streak')
        ?.unlocked,
    ).toBe(true);
    expect(
      achievements.find((achievement) => achievement.key === 'thirty-day-streak')
        ?.unlocked,
    ).toBe(false);
    expect(
      achievements.find((achievement) => achievement.key === 'first-savings')
        ?.unlocked,
    ).toBe(true);
  });

  it('persists unlocked achievements when database mode is enabled', async () => {
    process.env.DATABASE_URL = 'postgres://test';

    const prisma = {
      profile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'profile-1' }),
      },
      achievement: {
        upsert: jest.fn().mockResolvedValue(undefined),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'achievement-1',
              key: 'three-day-streak',
              title: 'Racha de 3 dias',
              description: 'Encadenar 3 dias exitosos.',
              type: AchievementType.STREAK,
              threshold: 3,
              unlockedBy: [],
            },
            {
              id: 'achievement-2',
              key: 'thirty-day-streak',
              title: 'Racha de 30 dias',
              description: 'Alcanzar un mes entero de continuidad.',
              type: AchievementType.STREAK,
              threshold: 30,
              unlockedBy: [],
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'achievement-1',
              key: 'three-day-streak',
              title: 'Racha de 3 dias',
              description: 'Encadenar 3 dias exitosos.',
              type: AchievementType.STREAK,
              threshold: 3,
              unlockedBy: [{ profileId: 'profile-1' }],
            },
            {
              id: 'achievement-2',
              key: 'thirty-day-streak',
              title: 'Racha de 30 dias',
              description: 'Alcanzar un mes entero de continuidad.',
              type: AchievementType.STREAK,
              threshold: 30,
              unlockedBy: [],
            },
          ]),
      },
      unlockedAchievement: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    const service = new AchievementsService(
      prisma as never,
      {
        summary: jest.fn().mockResolvedValue({
          smokeFreeDays: 2,
          moneySaved: 5000,
          cigarettesAvoided: 40,
          smokeFreeHours: 24,
          currentStreak: 3,
          bestStreak: 3,
          monthlyFreeDaysRemaining: 3,
        }),
      } as never,
    );

    const achievements = await service.list('user-1');

    expect(prisma.achievement.upsert).toHaveBeenCalledTimes(
      defaultAchievements.length,
    );
    expect(prisma.unlockedAchievement.upsert).toHaveBeenCalledTimes(1);
    expect(achievements).toEqual([
      expect.objectContaining({
        key: 'three-day-streak',
        unlocked: true,
      }),
      expect.objectContaining({
        key: 'thirty-day-streak',
        unlocked: false,
      }),
    ]);
  });
});
