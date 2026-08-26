import { TrainingMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAttemptDto {
  @IsUUID()
  shortcutId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(20, { each: true })
  pressed: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600_000)
  responseTimeMs: number;

  @IsOptional()
  @IsEnum(TrainingMode)
  mode?: TrainingMode;
}
