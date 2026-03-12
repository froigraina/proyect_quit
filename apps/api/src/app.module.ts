import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { DailyEntriesModule } from './modules/daily-entries/daily-entries.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProfileModule } from './modules/profile/profile.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProfileModule,
    DailyEntriesModule,
    StatsModule,
    AchievementsModule,
  ],
})
export class AppModule {}
