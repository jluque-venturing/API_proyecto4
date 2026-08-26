import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateShortcutDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  description: string;

  @IsString()
  tool: string;

  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(20, { each: true })
  expected: string[];
}
