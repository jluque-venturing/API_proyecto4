import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

const EJEMPLO_RESUMEN = {
  totalAttempts: 87,
  correct: 64,
  wrong: 23,
  accuracy: 74,
  avgResponseTimeMs: 1820,
  bestStreak: 12,
  currentStreak: 4,
  mastered: 9,
  totalShortcuts: 143,
};

const GLOSARIO = `
- **accuracy**: porcentaje entero de 0 a 100, no una fraccion.
- **avgResponseTimeMs**: promedio solo de los aciertos. Los errores no ensucian el tiempo.
- **currentStreak**: aciertos seguidos hasta ahora. Un error la vuelve a 0.
- **mastered**: atajos con 3 aciertos o mas.
- **totalShortcuts**: atajos disponibles para practicar, no los que practicaste.
`;

@ApiTags('stats')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Mis metricas globales',
    description: `No manda nada: la identidad sale del accessToken. Cuenta todos tus intentos, de todas las tools.\n${GLOSARIO}`,
  })
  @ApiOkResponse({ schema: { example: EJEMPLO_RESUMEN } })
  me(@CurrentUser('id') userId: string) {
    return this.stats.resumenGlobal(userId);
  }

  @Get('me/tools/:key')
  @ApiOperation({
    summary: 'Mis metricas en una tool',
    description: `Lo mismo que /stats/me pero contando solo los intentos de esa tool.\n${GLOSARIO}`,
  })
  @ApiParam({
    name: 'key',
    description: 'La key de la tool. Sacala de GET /tools.',
    example: 'vscode',
  })
  @ApiOkResponse({
    description: 'Igual al resumen global, mas el objeto tool adelante.',
    schema: {
      example: {
        tool: { key: 'vscode', title: 'Visual Studio Code' },
        ...EJEMPLO_RESUMEN,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No existe una tool con esa key.' })
  porTool(@CurrentUser('id') userId: string, @Param('key') key: string) {
    return this.stats.resumenPorTool(userId, key);
  }
}
