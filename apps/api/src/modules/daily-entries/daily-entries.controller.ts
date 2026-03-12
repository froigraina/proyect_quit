import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { AuthContext } from '../auth/auth.types';
import { DailyEntriesService } from './daily-entries.service';
import { UpsertDailyEntryDto } from './dto/upsert-daily-entry.dto';
import { PeriodQueryDto } from '../shared/dto/period-query.dto';

@Controller('daily-entries')
@UseGuards(AuthGuard)
export class DailyEntriesController {
  constructor(private readonly dailyEntriesService: DailyEntriesService) {}

  @Get()
  async list(@CurrentAuth() auth: AuthContext, @Query() query: PeriodQueryDto) {
    return this.dailyEntriesService.list(auth.user.id, query);
  }

  @Post()
  async create(@CurrentAuth() auth: AuthContext, @Body() payload: UpsertDailyEntryDto) {
    return this.dailyEntriesService.upsert(auth.user.id, payload);
  }

  @Patch(':date')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('date') date: string,
    @Body() payload: UpsertDailyEntryDto,
  ) {
    return this.dailyEntriesService.upsert(auth.user.id, {
      ...payload,
      date,
    });
  }
}
