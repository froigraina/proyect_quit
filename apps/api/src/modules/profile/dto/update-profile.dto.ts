import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export enum PlanModeDto {
  QUIT = 'QUIT',
  REDUCE = 'REDUCE',
}

export class UpdateProfileDto {
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsEnum(PlanModeDto)
  planMode?: PlanModeDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  baselineDailyConsumption?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  packPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyFreeDays?: number;
}
