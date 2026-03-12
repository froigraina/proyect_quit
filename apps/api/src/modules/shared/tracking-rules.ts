import {
  Prisma,
  EntryStatus,
  PlanMode,
  type DailyEntry,
  type Profile,
} from '@prisma/client';

type ProfileRules = Pick<
  Profile,
  'baselineDailyConsumption' | 'dailyGoal' | 'monthlyFreeDays' | 'planMode'
> & {
  packPrice: number;
};
type EntryLike = Pick<
  DailyEntry,
  | 'date'
  | 'cigarettesSmoked'
  | 'status'
  | 'cigarettesAvoided'
  | 'smokeFreeHours'
> & {
  moneySaved: number | Prisma.Decimal;
};

function toDateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getPricePerCigarette(packPrice: number) {
  return packPrice / 20;
}

export function resolveEntryOutcome(input: {
  cigarettesSmoked: number;
  profile: ProfileRules;
  freeDaysUsedInMonth: number;
}) {
  const { cigarettesSmoked, profile, freeDaysUsedInMonth } = input;
  const dailyGoal = profile.planMode === PlanMode.QUIT ? 0 : profile.dailyGoal;
  const isSuccess = cigarettesSmoked === 0 || cigarettesSmoked <= dailyGoal;
  const hasFreeDay = freeDaysUsedInMonth < profile.monthlyFreeDays;

  let status: EntryStatus = EntryStatus.SUCCESS;
  let freeDayUsed = false;

  if (!isSuccess) {
    if (hasFreeDay) {
      status = EntryStatus.USED_FREE_DAY;
      freeDayUsed = true;
    } else {
      status = EntryStatus.FAILED;
    }
  }

  const pricePerCigarette = getPricePerCigarette(profile.packPrice);
  const cigarettesAvoided = Math.max(
    0,
    profile.baselineDailyConsumption - cigarettesSmoked,
  );
  const moneySaved = Math.max(0, cigarettesAvoided * pricePerCigarette);
  const smokeFreeHours = cigarettesSmoked === 0 ? 24 : 0;

  return {
    dailyGoal,
    status,
    freeDayUsed,
    cigarettesAvoided,
    moneySaved,
    smokeFreeHours,
  };
}

export function buildStats(entries: EntryLike[], monthlyFreeDays: number) {
  const ordered = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let currentStreak = 0;
  let bestStreak = 0;

  for (const entry of ordered) {
    if (
      entry.status === EntryStatus.SUCCESS ||
      entry.status === EntryStatus.USED_FREE_DAY
    ) {
      currentStreak += 1;
    } else if (entry.status === EntryStatus.FAILED) {
      currentStreak = 0;
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  }

  const latestEntry = ordered.at(-1);
  const currentMonth = latestEntry ? new Date(latestEntry.date) : new Date();
  const monthlyFreeDaysUsed = ordered.filter((entry) => {
    const date = new Date(entry.date);
    return (
      date.getUTCFullYear() === currentMonth.getUTCFullYear() &&
      date.getUTCMonth() === currentMonth.getUTCMonth() &&
      entry.status === EntryStatus.USED_FREE_DAY
    );
  }).length;

  return {
    smokeFreeDays: ordered.filter((entry) => entry.cigarettesSmoked === 0)
      .length,
    moneySaved: ordered.reduce(
      (sum, entry) => sum + Number(entry.moneySaved),
      0,
    ),
    cigarettesAvoided: ordered.reduce(
      (sum, entry) => sum + entry.cigarettesAvoided,
      0,
    ),
    smokeFreeHours: latestEntry?.smokeFreeHours ?? 0,
    currentStreak,
    bestStreak,
    monthlyFreeDaysRemaining: Math.max(
      0,
      monthlyFreeDays - monthlyFreeDaysUsed,
    ),
  };
}

export function getMonthParts(value: Date | string) {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function isSameDay(left: Date | string, right: Date | string) {
  return toDateKey(left) === toDateKey(right);
}
