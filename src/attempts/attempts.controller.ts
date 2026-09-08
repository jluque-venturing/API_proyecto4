import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { QueryAttemptsDto } from './dto/query-attempts.dto';

@ApiTags('attempts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
@UseGuards(JwtAuthGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar un intento (la API corrige)',
    description:
      'El endpoint central. Mandas el shortcutId y las teclas que apreto el usuario. La API compara y te dice si estuvo bien en isCorrect. No mandes vos el resultado: no existe ese campo en el body y seria rechazado.',
  })
  @ApiCreatedResponse({
    description:
      'expected viene siempre, tambien cuando fallaste: sirve para mostrarle al usuario cual era.',
    schema: {
      example: {
        id: '9c4b2e10-7d3f-4a86-b501-2f8e6c1a9d77',
        isCorrect: true,
        pressed: ['Control', 'p'],
        expected: ['Control', 'p'],
        description: 'Abrir archivo rapidamente',
        responseTimeMs: 1450,
        currentStreak: 5,
        createdAt: '2026-09-08T12:41:02.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description:
      'Ese shortcutId no existe, o es un atajo privado de otro usuario.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAttemptDto) {
    return this.attempts.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Ver mi historial de intentos',
    description:
      'Solo tus intentos, del mas nuevo al mas viejo. Por defecto trae los ultimos 20; con limit pedis hasta 100.',
  })
  @ApiOkResponse({
    description: 'Cada intento trae anidado el atajo con su tool.',
    schema: {
      example: [
        {
          id: '9c4b2e10-7d3f-4a86-b501-2f8e6c1a9d77',
          pressed: ['Control', 'p'],
          isCorrect: true,
          responseTimeMs: 1450,
          mode: 'GUESS',
          createdAt: '2026-09-08T12:41:02.000Z',
          userId: '316a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
          shortcutId: '3f1a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
          shortcut: {
            description: 'Abrir archivo rapidamente',
            expected: ['Control', 'p'],
            level: 2,
            tool: { key: 'vscode', title: 'Visual Studio Code' },
          },
        },
      ],
    },
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filtros: QueryAttemptsDto,
  ) {
    return this.attempts.findAll(userId, filtros);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Borrar todo mi historial',
    description:
      'Borra TODOS tus intentos y resetea las stats a cero. No pide confirmacion y no se puede deshacer. Los atajos no se tocan.',
  })
  @ApiNoContentResponse({ description: 'Historial borrado. No devuelve body.' })
  removeAll(@CurrentUser('id') userId: string) {
    return this.attempts.removeAll(userId);
  }
}
