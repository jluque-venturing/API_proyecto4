import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryShortcutsDto {
  @IsOptional()
  @IsString()
  tool?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;
}

export class RandomShortcutDto extends QueryShortcutsDto {
  @IsOptional()
  @IsUUID()
  exclude?: string;
}
