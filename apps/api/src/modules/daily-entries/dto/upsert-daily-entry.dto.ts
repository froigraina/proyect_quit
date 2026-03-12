import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertDailyEntryDto {
  @IsDateString()
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  cigarettesSmoked!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
