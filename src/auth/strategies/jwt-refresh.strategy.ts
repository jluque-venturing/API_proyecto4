import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUserWithRefresh, JwtPayload } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: JwtPayload): AuthUserWithRefresh {
    const refreshToken = (request.body as { refreshToken?: string })
      ?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    return { id: payload.sub, email: payload.email, refreshToken };
  }
}
