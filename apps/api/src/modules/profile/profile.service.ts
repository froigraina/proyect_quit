import { Injectable } from '@nestjs/common';
import { PlanMode, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultProfile } from '../shared/defaults';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(value: Date | string) {
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toSnapshotData(profile: {
    planMode: PlanMode;
    baselineDailyConsumption: number;
    dailyGoal: number;
    packPrice: Prisma.Decimal | number;
    monthlyFreeDays: number;
  }) {
    return {
      planMode: profile.planMode,
      baselineDailyConsumption: profile.baselineDailyConsumption,
      dailyGoal: profile.dailyGoal,
      packPrice: new Prisma.Decimal(profile.packPrice),
      monthlyFreeDays: profile.monthlyFreeDays,
    };
  }

  private async ensureSettingsSnapshot(
    profile: {
      id: string;
      planMode: PlanMode;
      baselineDailyConsumption: number;
      dailyGoal: number;
      packPrice: Prisma.Decimal;
      monthlyFreeDays: number;
      createdAt?: Date;
    },
    effectiveFrom?: Date,
  ) {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    const snapshotDate = this.normalizeDate(
      effectiveFrom ?? profile.createdAt ?? new Date(),
    );

    return this.prisma.profileSettingsSnapshot.upsert({
      where: {
        profileId_effectiveFrom: {
          profileId: profile.id,
          effectiveFrom: snapshotDate,
        },
      },
      update: this.toSnapshotData(profile),
      create: {
        profileId: profile.id,
        effectiveFrom: snapshotDate,
        ...this.toSnapshotData(profile),
      },
    });
  }

  private async getLatestSnapshot(profileId: string) {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    return this.prisma.profileSettingsSnapshot.findFirst({
      where: { profileId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  private serializeProfile(profile: {
    id: string;
    timezone: string;
    planMode: PlanMode;
    baselineDailyConsumption: number;
    dailyGoal: number;
    packPrice: Prisma.Decimal;
    monthlyFreeDays: number;
    onboardingCompletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    settingsEffectiveFrom?: Date | null;
  }) {
    return {
      ...profile,
      packPrice: Number(profile.packPrice),
      onboardingCompleted: Boolean(profile.onboardingCompletedAt),
      onboardingCompletedAt:
        profile.onboardingCompletedAt?.toISOString() ?? null,
      settingsEffectiveFrom:
        profile.settingsEffectiveFrom?.toISOString().slice(0, 10) ?? null,
      createdAt: profile.createdAt?.toISOString(),
      updatedAt: profile.updatedAt?.toISOString(),
      persistenceStatus: process.env.DATABASE_URL ? 'connected' : 'fallback',
    };
  }

  private serializeSettingsSnapshot(snapshot: {
    effectiveFrom: Date;
    planMode: PlanMode;
    baselineDailyConsumption: number;
    dailyGoal: number;
    packPrice: Prisma.Decimal;
    monthlyFreeDays: number;
  }) {
    return {
      effectiveFrom: snapshot.effectiveFrom.toISOString().slice(0, 10),
      planMode: snapshot.planMode,
      baselineDailyConsumption: snapshot.baselineDailyConsumption,
      dailyGoal: snapshot.dailyGoal,
      packPrice: Number(snapshot.packPrice),
      monthlyFreeDays: snapshot.monthlyFreeDays,
    };
  }

  async ensureProfileForUser(userId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: 'local-profile',
        ...defaultProfile,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (existing) {
      await this.ensureSettingsSnapshot(existing, existing.createdAt);
      return existing;
    }

    const created = await this.prisma.profile.create({
      data: {
        ...defaultProfile,
        userId,
      },
    });

    await this.ensureSettingsSnapshot(created, created.createdAt);

    return created;
  }

  async getProfile(userId: string) {
    const profile = await this.ensureProfileForUser(userId);
    const latestSnapshot = await this.getLatestSnapshot(profile.id);
    return this.serializeProfile({
      ...profile,
      settingsEffectiveFrom: latestSnapshot?.effectiveFrom ?? profile.createdAt,
    });
  }

  async getSettingsHistory(userId: string) {
    const profile = await this.ensureProfileForUser(userId);

    if (!process.env.DATABASE_URL) {
      return [
        this.serializeSettingsSnapshot({
          effectiveFrom: this.normalizeDate(new Date()),
          planMode: profile.planMode,
          baselineDailyConsumption: profile.baselineDailyConsumption,
          dailyGoal: profile.dailyGoal,
          packPrice: profile.packPrice,
          monthlyFreeDays: profile.monthlyFreeDays,
        }),
      ];
    }

    const snapshots = await this.prisma.profileSettingsSnapshot.findMany({
      where: { profileId: profile.id },
      orderBy: { effectiveFrom: 'desc' },
      take: 6,
    });

    return snapshots.map((snapshot) => this.serializeSettingsSnapshot(snapshot));
  }

  async updateProfile(userId: string, payload: UpdateProfileDto) {
    const current = await this.ensureProfileForUser(userId);
    const effectiveFrom = this.normalizeDate(payload.effectiveFrom ?? new Date());
    const { effectiveFrom: _ignoredEffectiveFrom, ...updates } = payload;

    if (!process.env.DATABASE_URL) {
      return this.serializeProfile({
        ...current,
        ...updates,
        packPrice:
          payload.packPrice !== undefined
            ? new Prisma.Decimal(payload.packPrice)
            : current.packPrice,
        settingsEffectiveFrom: effectiveFrom,
        updatedAt: new Date(),
      });
    }

    const updated = await this.prisma.profile.update({
      where: { id: current.id },
      data: {
        ...updates,
        packPrice:
          payload.packPrice !== undefined
            ? new Prisma.Decimal(payload.packPrice)
            : undefined,
      },
    });

    await this.ensureSettingsSnapshot(updated, effectiveFrom);

    return this.serializeProfile({
      ...updated,
      settingsEffectiveFrom: effectiveFrom,
    });
  }

  async completeOnboarding(userId: string, payload: CompleteOnboardingDto) {
    const current = await this.ensureProfileForUser(userId);
    const onboardingCompletedAt = new Date();
    const effectiveFrom = this.normalizeDate(onboardingCompletedAt);

    if (!process.env.DATABASE_URL) {
      return this.serializeProfile({
        ...current,
        ...payload,
        packPrice: new Prisma.Decimal(payload.packPrice),
        onboardingCompletedAt,
        settingsEffectiveFrom: effectiveFrom,
        updatedAt: onboardingCompletedAt,
      });
    }

    const data: Prisma.ProfileUpdateInput = {
      planMode: payload.planMode,
      baselineDailyConsumption: payload.baselineDailyConsumption,
      dailyGoal: payload.dailyGoal,
      packPrice: new Prisma.Decimal(payload.packPrice),
      monthlyFreeDays: payload.monthlyFreeDays,
      onboardingCompletedAt,
    };

    const updated = await this.prisma.profile.update({
      where: { id: current.id },
      data,
    });

    await this.ensureSettingsSnapshot(updated, effectiveFrom);

    return this.serializeProfile({
      ...updated,
      settingsEffectiveFrom: effectiveFrom,
    });
  }
}
