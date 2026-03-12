import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DailyEntriesController } from './daily-entries.controller';
import { DailyEntriesService } from './daily-entries.service';

@Module({
  imports: [AuthModule],
  controllers: [DailyEntriesController],
  providers: [DailyEntriesService],
})
export class DailyEntriesModule {}
