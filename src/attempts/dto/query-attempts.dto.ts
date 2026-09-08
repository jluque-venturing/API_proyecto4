import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAttemptsDto {
  @ApiPropertyOptional({
    description: 'Filtra el historial por key de tool.',
    example: 'vscode',
  })
  @IsOptional()
  @IsString()
  tool?: string;

  @ApiPropertyOptional({
    description:
      'Cuantos intentos traer, del mas nuevo al mas viejo. Por defecto 20.',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
