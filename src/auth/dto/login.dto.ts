import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'El email con el que te registraste.',
    example: 'jonatan@ejemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Tu password. Si falla, responde 401 sin decir que campo estuvo mal.',
    example: 'atajos-2026',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
