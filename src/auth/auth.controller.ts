import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

const EJEMPLO_TOKENS = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMTZhIn0.access-vive-15-min',
  refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMTZhIn0.refresh-vive-7-dias',
};

@ApiTags('auth')
@ApiTooManyRequestsResponse({
  description:
    'Demasiados intentos. El limite es 5 por minuto en register y login.',
})
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una cuenta',
    description:
      'Mandas email y password (y opcionalmente name). Te devuelve el par de tokens, ya logueado: no hace falta llamar a /auth/login despues.',
  })
  @ApiCreatedResponse({
    description: 'Cuenta creada y sesion abierta.',
    schema: { example: EJEMPLO_TOKENS },
  })
  @ApiConflictResponse({ description: 'Ese email ya tiene cuenta.' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion',
    description:
      'Mandas email y password. Te devuelve el par de tokens. Guarda el accessToken para las demas rutas y el refreshToken para renovarlo.',
  })
  @ApiOkResponse({
    description: 'Sesion abierta.',
    schema: { example: EJEMPLO_TOKENS },
  })
  @ApiUnauthorizedResponse({
    description:
      'Credenciales invalidas. Es el mismo error si el email no existe o si la password esta mal, a proposito.',
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar los tokens',
    description:
      'Mandas el refreshToken en el body (NO en el header Authorization). Te devuelve un par nuevo y el anterior queda invalido.',
  })
  @ApiOkResponse({
    description: 'Par de tokens nuevo. El refreshToken viejo ya no sirve.',
    schema: { example: EJEMPLO_TOKENS },
  })
  @ApiUnauthorizedResponse({
    description:
      'El refreshToken vencio, no coincide, o se cerro sesion con /auth/logout.',
  })
  refresh(@CurrentUser('id') userId: string, @Body() dto: RefreshDto) {
    return this.auth.refresh(userId, dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cerrar sesion',
    description:
      'No manda body. Mata el refreshToken al instante. El accessToken sigue vivo hasta que venza: no se puede revocar.',
  })
  @ApiNoContentResponse({ description: 'Sesion cerrada. No devuelve body.' })
  @ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
  logout(@CurrentUser('id') userId: string) {
    return this.auth.logout(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Ver mi perfil',
    description:
      'No manda nada. La identidad sale del accessToken, no de la URL. Nunca devuelve la password.',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario logueado.',
    schema: {
      example: {
        id: '316a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
        email: 'jonatan@ejemplo.com',
        name: 'Jonatan',
        createdAt: '2026-09-01T14:23:11.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }
}
