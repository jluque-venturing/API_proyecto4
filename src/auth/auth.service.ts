import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { Tokens } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<Tokens> {
    const existente = await this.users.findByEmail(dto.email);
    if (existente) throw new ConflictException('El email ya esta registrado');

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({ ...dto, password });

    return this.emitirTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.users.findByEmail(dto.email);
    // Mismo mensaje para email inexistente y password incorrecta: no revelar que usuarios existen.
    if (!user) throw new UnauthorizedException('Credenciales invalidas');

    const coincide = await bcrypt.compare(dto.password, user.password);
    if (!coincide) throw new UnauthorizedException('Credenciales invalidas');

    return this.emitirTokens(user.id, user.email);
  }

  async refresh(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.users.findById(userId);
    if (!user?.refreshTokenHash) throw new UnauthorizedException('Sesion cerrada');

    if (this.hashToken(refreshToken) !== user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    return this.emitirTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  me(userId: string) {
    return this.users.findProfile(userId);
  }

  private async emitirTokens(sub: string, email: string): Promise<Tokens> {
    const payload = { sub, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.duracion('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.duracion('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    await this.users.setRefreshTokenHash(sub, this.hashToken(refreshToken));

    return { accessToken, refreshToken };
  }

  private duracion(clave: string, porDefecto: string) {
    return this.config.get<string>(clave, porDefecto) as JwtSignOptions['expiresIn'];
  }

  // SHA-256 y no bcrypt: el token ya es de alta entropia y bcrypt truncaria el JWT a 72 bytes.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
