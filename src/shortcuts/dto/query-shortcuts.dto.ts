import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryShortcutsDto {
  @ApiPropertyOptional({
    description: 'Filtra por key de tool. Sacala de GET /tools.',
    example: 'vscode',
  })
  @IsOptional()
  @IsString()
  tool?: string;

  @ApiPropertyOptional({
    description: 'Filtra por dificultad, de 1 a 4.',
    minimum: 1,
    maximum: 4,
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;
}

export class RandomShortcutDto extends QueryShortcutsDto {
  @ApiPropertyOptional({
    description:
      'Id del atajo que acabas de mostrar, para no repetirlo. Si era el unico candidato, se repite igual.',
    format: 'uuid',
    example: '3f1a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
  })
  @IsOptional()
  @IsUUID()
  exclude?: string;
}
