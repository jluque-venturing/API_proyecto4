import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description:
      'Id del atajo que se le mostro al usuario. Sale de GET /shortcuts/random.',
    format: 'uuid',
    example: '3f1a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
  })
  @IsUUID()
  shortcutId: string;

  @ApiProperty({
    description:
      'Las teclas que apreto el usuario. No mandes si estuvo bien o mal: eso lo decide la API.',
    type: [String],
    minItems: 1,
    maxItems: 5,
    example: ['Control', 'Shift', 'P'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(20, { each: true })
  pressed: string[];

  @ApiProperty({
    description:
      'Cuanto tardo en responder, en milisegundos. Maximo 10 minutos.',
    minimum: 0,
    maximum: 600_000,
    example: 1450,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600_000)
  responseTimeMs: number;

  @ApiPropertyOptional({
    description: 'Modo de entrenamiento. Si no lo mandas, queda GUESS.',
    enum: TrainingMode,
    default: TrainingMode.GUESS,
    example: TrainingMode.GUESS,
  })
  @IsOptional()
  @IsEnum(TrainingMode)
  mode?: TrainingMode;
}
