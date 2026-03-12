import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { PlanModeDto } from './update-profile.dto';

export class CompleteOnboardingDto {
  @IsEnum(PlanModeDto)
  planMode!: PlanModeDto;

  @IsInt()
  @Min(0)
  baselineDailyConsumption!: number;

  @IsInt()
  @Min(0)
  dailyGoal!: number;

  @IsNumber()
  @Min(0)
  packPrice!: number;

  @IsInt()
  @Min(0)
  monthlyFreeDays!: number;
}
