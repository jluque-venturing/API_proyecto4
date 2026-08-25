import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  // bcrypt trunca a 72 bytes: mas alla de eso no aporta seguridad.
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
