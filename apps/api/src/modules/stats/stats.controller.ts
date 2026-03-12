import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { AuthContext } from '../auth/auth.types';
import { PeriodQueryDto } from '../shared/dto/period-query.dto';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  async summary(@CurrentAuth() auth: AuthContext, @Query() query: PeriodQueryDto) {
    return this.statsService.summary(auth.user.id, query);
  }
}
