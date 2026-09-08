import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email unico. Si ya existe, responde 409.',
    example: 'jonatan@ejemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Minimo 8 caracteres, maximo 72.',
    minLength: 8,
    maxLength: 72,
    example: 'atajos-2026',
  })
  @IsString()
  @MinLength(8)
  // bcrypt trunca a 72 bytes: mas alla de eso no aporta seguridad.
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre para mostrar. Opcional.',
    maxLength: 60,
    example: 'Jonatan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
