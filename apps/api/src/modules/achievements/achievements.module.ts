import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [AuthModule, StatsModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
