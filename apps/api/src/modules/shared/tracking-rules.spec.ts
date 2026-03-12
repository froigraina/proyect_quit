import { EntryStatus, PlanMode } from '@prisma/client';
import { buildStats, resolveEntryOutcome } from './tracking-rules';

describe('tracking-rules', () => {
  describe('resolveEntryOutcome', () => {
    it('marks the day as success when consumption stays within the daily goal', () => {
      const outcome = resolveEntryOutcome({
        cigarettesSmoked: 3,
        profile: {
          planMode: PlanMode.REDUCE,
          baselineDailyConsumption: 8,
          dailyGoal: 3,
          monthlyFreeDays: 4,
          packPrice: 4000,
        },
        freeDaysUsedInMonth: 0,
      });

      expect(outcome).toMatchObject({
        dailyGoal: 3,
        status: EntryStatus.SUCCESS,
        freeDayUsed: false,
        cigarettesAvoided: 5,
        smokeFreeHours: 0,
      });
      expect(outcome.moneySaved).toBe(1000);
    });

    it('uses a free day when the goal is missed but there is monthly allowance left', () => {
      const outcome = resolveEntryOutcome({
        cigarettesSmoked: 5,
        profile: {
          planMode: PlanMode.REDUCE,
          baselineDailyConsumption: 8,
          dailyGoal: 3,
          monthlyFreeDays: 4,
          packPrice: 4000,
        },
        freeDaysUsedInMonth: 2,
      });

      expect(outcome.status).toBe(EntryStatus.USED_FREE_DAY);
      expect(outcome.freeDayUsed).toBe(true);
    });

    it('fails the day when there are no free days left', () => {
      const outcome = resolveEntryOutcome({
        cigarettesSmoked: 6,
        profile: {
          planMode: PlanMode.REDUCE,
          baselineDailyConsumption: 8,
          dailyGoal: 3,
          monthlyFreeDays: 1,
          packPrice: 4000,
        },
        freeDaysUsedInMonth: 1,
      });

      expect(outcome.status).toBe(EntryStatus.FAILED);
      expect(outcome.freeDayUsed).toBe(false);
    });

    it('forces the goal to zero in quit mode', () => {
      const outcome = resolveEntryOutcome({
        cigarettesSmoked: 1,
        profile: {
          planMode: PlanMode.QUIT,
          baselineDailyConsumption: 8,
          dailyGoal: 3,
          monthlyFreeDays: 0,
          packPrice: 4000,
        },
        freeDaysUsedInMonth: 0,
      });

      expect(outcome.dailyGoal).toBe(0);
      expect(outcome.status).toBe(EntryStatus.FAILED);
    });
  });

  describe('buildStats', () => {
    it('counts used free days as part of the streak continuity', () => {
      const summary = buildStats(
        [
          {
            date: new Date('2026-03-01T00:00:00.000Z'),
            cigarettesSmoked: 0,
            status: EntryStatus.SUCCESS,
            cigarettesAvoided: 8,
            moneySaved: 1800,
            smokeFreeHours: 24,
          },
          {
            date: new Date('2026-03-02T00:00:00.000Z'),
            cigarettesSmoked: 5,
            status: EntryStatus.USED_FREE_DAY,
            cigarettesAvoided: 3,
            moneySaved: 675,
            smokeFreeHours: 0,
          },
          {
            date: new Date('2026-03-03T00:00:00.000Z'),
            cigarettesSmoked: 2,
            status: EntryStatus.SUCCESS,
            cigarettesAvoided: 6,
            moneySaved: 1350,
            smokeFreeHours: 0,
          },
        ],
        4,
      );

      expect(summary.currentStreak).toBe(3);
      expect(summary.bestStreak).toBe(3);
      expect(summary.monthlyFreeDaysRemaining).toBe(3);
    });

    it('resets the streak only on failed days', () => {
      const summary = buildStats(
        [
          {
            date: new Date('2026-03-01T00:00:00.000Z'),
            cigarettesSmoked: 0,
            status: EntryStatus.SUCCESS,
            cigarettesAvoided: 8,
            moneySaved: 1800,
            smokeFreeHours: 24,
          },
          {
            date: new Date('2026-03-02T00:00:00.000Z'),
            cigarettesSmoked: 7,
            status: EntryStatus.FAILED,
            cigarettesAvoided: 1,
            moneySaved: 225,
            smokeFreeHours: 0,
          },
          {
            date: new Date('2026-03-03T00:00:00.000Z'),
            cigarettesSmoked: 0,
            status: EntryStatus.SUCCESS,
            cigarettesAvoided: 8,
            moneySaved: 1800,
            smokeFreeHours: 24,
          },
        ],
        4,
      );

      expect(summary.currentStreak).toBe(1);
      expect(summary.bestStreak).toBe(1);
      expect(summary.smokeFreeDays).toBe(2);
    });
  });
});
