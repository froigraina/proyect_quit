import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  type DailyEntry,
  type PlanMode,
  type Profile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultProfile } from '../shared/defaults';
import {
  getMonthParts,
  isSameDay,
  resolveEntryOutcome,
} from '../shared/tracking-rules';
import { PeriodQueryDto } from '../shared/dto/period-query.dto';
import { UpsertDailyEntryDto } from './dto/upsert-daily-entry.dto';

@Injectable()
export class DailyEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(value: Date | string) {
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toRulesProfile(input: {
    planMode: PlanMode;
    baselineDailyConsumption: number;
    dailyGoal: number;
    monthlyFreeDays: number;
    packPrice: Prisma.Decimal | number;
  }) {
    return {
      planMode: input.planMode,
      baselineDailyConsumption: input.baselineDailyConsumption,
      dailyGoal: input.dailyGoal,
      monthlyFreeDays: input.monthlyFreeDays,
      packPrice: Number(input.packPrice),
    };
  }

  private fallbackEntries(): Array<DailyEntry> {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setUTCDate(today.getUTCDate() - 2);
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    return [
      {
        id: 'entry-1',
        profileId: 'local-profile',
        date: twoDaysAgo,
        cigarettesSmoked: 0,
        dailyGoal: defaultProfile.dailyGoal,
        status: 'SUCCESS',
        freeDayUsed: false,
        moneySaved: new Prisma.Decimal(1800),
        cigarettesAvoided: 8,
        smokeFreeHours: 24,
        notes: null,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: 'entry-2',
        profileId: 'local-profile',
        date: yesterday,
        cigarettesSmoked: 5,
        dailyGoal: defaultProfile.dailyGoal,
        status: 'USED_FREE_DAY',
        freeDayUsed: true,
        moneySaved: new Prisma.Decimal(675),
        cigarettesAvoided: 3,
        smokeFreeHours: 0,
        notes: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
    ] as DailyEntry[];
  }

  private serializeEntry(entry: DailyEntry) {
    return {
      ...entry,
      date: entry.date.toISOString().slice(0, 10),
      moneySaved: Number(entry.moneySaved),
      canEdit: true,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private filterByPeriod(
    entries: DailyEntry[],
    query?: PeriodQueryDto,
  ): DailyEntry[] {
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

  private buildMonthDateRange(year: number, month: number) {
    return {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  private async ensureProfile(userId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: 'local-profile',
        ...defaultProfile,
        userId,
        createdAt: new Date(),
      };
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return this.prisma.profile.create({
        data: {
          ...defaultProfile,
          userId,
        },
      });
    }

    return profile;
  }

  private async resolveProfileSettingsForDate(
    profile: Pick<
      Profile,
      | 'id'
      | 'planMode'
      | 'baselineDailyConsumption'
      | 'dailyGoal'
      | 'monthlyFreeDays'
      | 'packPrice'
      | 'createdAt'
    >,
    date: Date,
  ) {
    if (!process.env.DATABASE_URL) {
      return this.toRulesProfile(profile);
    }

    const normalizedDate = this.normalizeDate(date);
    const snapshot =
      (await this.prisma.profileSettingsSnapshot.findFirst({
        where: {
          profileId: profile.id,
          effectiveFrom: {
            lte: normalizedDate,
          },
        },
        orderBy: { effectiveFrom: 'desc' },
      })) ??
      (await this.prisma.profileSettingsSnapshot.findFirst({
        where: { profileId: profile.id },
        orderBy: { effectiveFrom: 'asc' },
      }));

    if (!snapshot) {
      return this.toRulesProfile(profile);
    }

    return this.toRulesProfile(snapshot);
  }

  async list(userId: string, query?: PeriodQueryDto) {
    if (!process.env.DATABASE_URL) {
      return this.filterByPeriod(this.fallbackEntries(), query).map((entry) =>
        this.serializeEntry(entry),
      );
    }

    const profile = await this.ensureProfile(userId);
    const entries = await this.prisma.dailyEntry.findMany({
      where: {
        profileId: profile.id,
        date:
          query?.year && query.month
            ? this.buildMonthDateRange(query.year, query.month)
            : undefined,
      },
      orderBy: { date: 'asc' },
    });

    return entries.map((entry) => this.serializeEntry(entry));
  }

  async upsert(userId: string, payload: UpsertDailyEntryDto) {
    const profile = await this.ensureProfile(userId);
    const entryDate = new Date(payload.date);
    const today = new Date();
    const normalizedEntryDate = new Date(
      Date.UTC(
        entryDate.getUTCFullYear(),
        entryDate.getUTCMonth(),
        entryDate.getUTCDate(),
      ),
    );
    const normalizedToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    if (normalizedEntryDate.getTime() > normalizedToday.getTime()) {
      throw new BadRequestException(
        'Future days cannot be created or edited in this stage.',
      );
    }

    if (!process.env.DATABASE_URL) {
      const monthEntries = this.fallbackEntries().filter((entry) => {
        const month = getMonthParts(entry.date);
        const target = getMonthParts(entryDate);
        return month.year === target.year && month.month === target.month;
      });
      const currentMonthFreeDays = monthEntries.filter(
        (entry) => entry.status === 'USED_FREE_DAY',
      ).length;
      const outcome = resolveEntryOutcome({
        cigarettesSmoked: payload.cigarettesSmoked,
        profile: this.toRulesProfile(profile),
        freeDaysUsedInMonth: currentMonthFreeDays,
      });

      return {
        id: 'local-entry',
        profileId: profile.id,
        date: payload.date,
        cigarettesSmoked: payload.cigarettesSmoked,
        notes: payload.notes ?? null,
        ...outcome,
        moneySaved: Number(outcome.moneySaved.toFixed(2)),
        canEdit: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const existingMonthEntries = await this.prisma.dailyEntry.findMany({
      where: {
        profileId: profile.id,
        date: this.buildMonthDateRange(
          entryDate.getUTCFullYear(),
          entryDate.getUTCMonth() + 1,
        ),
      },
      orderBy: { date: 'asc' },
    });

    const freeDaysUsedInMonth = existingMonthEntries.filter(
      (entry) =>
        entry.status === 'USED_FREE_DAY' && !isSameDay(entry.date, entryDate),
    ).length;
    const effectiveProfile = await this.resolveProfileSettingsForDate(
      profile,
      entryDate,
    );

    const outcome = resolveEntryOutcome({
      cigarettesSmoked: payload.cigarettesSmoked,
      profile: effectiveProfile,
      freeDaysUsedInMonth,
    });

    const result = await this.prisma.dailyEntry.upsert({
      where: {
        profileId_date: {
          profileId: profile.id,
          date: entryDate,
        },
      },
      update: {
        cigarettesSmoked: payload.cigarettesSmoked,
        notes: payload.notes,
        dailyGoal: outcome.dailyGoal,
        status: outcome.status,
        freeDayUsed: outcome.freeDayUsed,
        moneySaved: new Prisma.Decimal(outcome.moneySaved),
        cigarettesAvoided: outcome.cigarettesAvoided,
        smokeFreeHours: outcome.smokeFreeHours,
      },
      create: {
        profileId: profile.id,
        date: entryDate,
        cigarettesSmoked: payload.cigarettesSmoked,
        notes: payload.notes,
        dailyGoal: outcome.dailyGoal,
        status: outcome.status,
        freeDayUsed: outcome.freeDayUsed,
        moneySaved: new Prisma.Decimal(outcome.moneySaved),
        cigarettesAvoided: outcome.cigarettesAvoided,
        smokeFreeHours: outcome.smokeFreeHours,
      },
    });

    const { year, month } = getMonthParts(entryDate);
    const freeDaysUsed = await this.prisma.dailyEntry.count({
      where: {
        profileId: profile.id,
        status: 'USED_FREE_DAY',
        date: this.buildMonthDateRange(year, month),
      },
    });

    await this.prisma.monthlyAllowance.upsert({
      where: {
        profileId_year_month: {
          profileId: profile.id,
          year,
          month,
        },
      },
      update: {
        freeDaysLimit: effectiveProfile.monthlyFreeDays,
        freeDaysUsed,
      },
      create: {
        profileId: profile.id,
        year,
        month,
        freeDaysLimit: effectiveProfile.monthlyFreeDays,
        freeDaysUsed,
      },
    });

    return this.serializeEntry(result);
  }
}
