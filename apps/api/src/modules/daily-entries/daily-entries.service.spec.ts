import { BadRequestException } from '@nestjs/common';
import { EntryStatus, PlanMode, Prisma } from '@prisma/client';
import { DailyEntriesService } from './daily-entries.service';

describe('DailyEntriesService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    jest.clearAllMocks();
  });

  it('rejects future days', async () => {
    delete process.env.DATABASE_URL;

    const service = new DailyEntriesService({} as never);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    await expect(
      service.upsert('user-1', {
        date: tomorrow.toISOString().slice(0, 10),
        cigarettesSmoked: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses the settings snapshot effective for the edited day', async () => {
    process.env.DATABASE_URL = 'postgres://test';

    const prisma = {
      profile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'profile-1',
          userId: 'user-1',
          planMode: PlanMode.REDUCE,
          baselineDailyConsumption: 10,
          dailyGoal: 4,
          monthlyFreeDays: 4,
          packPrice: new Prisma.Decimal(6000),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        create: jest.fn(),
      },
      profileSettingsSnapshot: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            profileId: 'profile-1',
            effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
            planMode: PlanMode.REDUCE,
            baselineDailyConsumption: 10,
            dailyGoal: 4,
            monthlyFreeDays: 4,
            packPrice: new Prisma.Decimal(4000),
          }),
      },
      dailyEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({
          id: 'entry-1',
          profileId: 'profile-1',
          date: new Date('2026-03-10T00:00:00.000Z'),
          cigarettesSmoked: 2,
          dailyGoal: 4,
          status: EntryStatus.SUCCESS,
          freeDayUsed: false,
          moneySaved: new Prisma.Decimal(1600),
          cigarettesAvoided: 8,
          smokeFreeHours: 0,
          notes: null,
          createdAt: new Date('2026-03-10T00:00:00.000Z'),
          updatedAt: new Date('2026-03-10T00:00:00.000Z'),
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      monthlyAllowance: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    const service = new DailyEntriesService(prisma as never);

    await service.upsert('user-1', {
      date: '2026-03-10',
      cigarettesSmoked: 2,
    });

    expect(prisma.profileSettingsSnapshot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          profileId: 'profile-1',
          effectiveFrom: {
            lte: new Date('2026-03-10T00:00:00.000Z'),
          },
        },
        orderBy: { effectiveFrom: 'desc' },
      }),
    );
    expect(prisma.dailyEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          dailyGoal: 4,
          cigarettesAvoided: 8,
          moneySaved: new Prisma.Decimal(1600),
        }),
        create: expect.objectContaining({
          dailyGoal: 4,
          cigarettesAvoided: 8,
          moneySaved: new Prisma.Decimal(1600),
        }),
      }),
    );
  });
});
