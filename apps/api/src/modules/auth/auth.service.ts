import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultProfile } from '../shared/defaults';
import { AuthenticatedUser, AuthContext } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException(
        'Authentication requires a configured database connection.',
      );
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [salt, storedHash] = passwordHash.split(':');
    const candidate = scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHash, 'hex');

    if (candidate.byteLength !== stored.byteLength) {
      return false;
    }

    return timingSafeEqual(candidate, stored);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private serializeUser(user: AuthenticatedUser) {
    return user;
  }

  private async createSession(userId: string) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 45);

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      session,
      token: rawToken,
    };
  }

  private async buildAuthPayload(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: {
          select: {
            onboardingCompletedAt: true,
          },
        },
      },
    });

    return {
      token,
      user: this.serializeUser({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      }),
      onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
    };
  }

  async register(payload: {
    displayName: string;
    email: string;
    password: string;
  }) {
    this.ensureDatabase();
    const email = this.normalizeEmail(payload.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('There is already an account for this email.');
    }

    const effectiveFrom = new Date();
    effectiveFrom.setUTCHours(0, 0, 0, 0);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          displayName: payload.displayName.trim(),
          passwordHash: this.hashPassword(payload.password),
        },
      });

      const profile = await tx.profile.create({
        data: {
          ...defaultProfile,
          userId: createdUser.id,
        },
      });

      await tx.profileSettingsSnapshot.create({
        data: {
          profileId: profile.id,
          effectiveFrom,
          planMode: defaultProfile.planMode,
          baselineDailyConsumption: defaultProfile.baselineDailyConsumption,
          dailyGoal: defaultProfile.dailyGoal,
          packPrice: new Prisma.Decimal(defaultProfile.packPrice),
          monthlyFreeDays: defaultProfile.monthlyFreeDays,
        },
      });

      return createdUser;
    });

    const { token } = await this.createSession(user.id);
    return this.buildAuthPayload(user.id, token);
  }

  async login(payload: { email: string; password: string }) {
    this.ensureDatabase();
    const email = this.normalizeEmail(payload.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !this.verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { token } = await this.createSession(user.id);
    return this.buildAuthPayload(user.id, token);
  }

  async validateToken(token: string): Promise<AuthContext> {
    this.ensureDatabase();
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      sessionId: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
      },
    };
  }

  async me(auth: AuthContext) {
    this.ensureDatabase();
    const profile = await this.prisma.profile.findUnique({
      where: { userId: auth.user.id },
      select: { onboardingCompletedAt: true },
    });

    return {
      user: this.serializeUser(auth.user),
      onboardingCompleted: Boolean(profile?.onboardingCompletedAt),
    };
  }

  async changePassword(
    auth: AuthContext,
    payload: { currentPassword: string; nextPassword: string },
  ) {
    this.ensureDatabase();
    const user = await this.prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (
      !user ||
      !this.verifyPassword(payload.currentPassword, user.passwordHash)
    ) {
      throw new UnauthorizedException('Current password is invalid.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: this.hashPassword(payload.nextPassword),
      },
    });

    return { success: true };
  }

  async logout(auth: AuthContext) {
    this.ensureDatabase();
    await this.prisma.authSession.delete({
      where: { id: auth.sessionId },
    });

    return { success: true };
  }
}
