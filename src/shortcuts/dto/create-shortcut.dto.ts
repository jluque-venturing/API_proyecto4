import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description:
      'Que hace el atajo. Es lo que se le muestra al usuario para que adivine.',
    minLength: 3,
    maxLength: 120,
    example: 'Abrir la paleta de comandos',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  description: string;

  @ApiProperty({
    description:
      'La key de una tool existente. Sacala de GET /tools. Si no existe, responde 404.',
    example: 'vscode',
  })
  @IsString()
  tool: string;

  @ApiProperty({
    description: 'Dificultad, de 1 (basico) a 4 (avanzado).',
    minimum: 1,
    maximum: 4,
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @ApiProperty({
    description:
      'Las teclas correctas, una por elemento. El orden no importa: la API normaliza antes de comparar.',
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
  expected: string[];
}
