import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShortcutDto } from './dto/create-shortcut.dto';
import {
  QueryShortcutsDto,
  RandomShortcutDto,
} from './dto/query-shortcuts.dto';
import { UpdateShortcutDto } from './dto/update-shortcut.dto';
import { ShortcutsService } from './shortcuts.service';

// expected sale ya normalizado: las teclas de un solo caracter se guardan en minuscula.
const EJEMPLO_ATAJO = {
  id: '3f1a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
  description: 'Abrir archivo rapidamente',
  expected: ['Control', 'p'],
  level: 2,
  toolId: 'b21f9d40-1c77-4e0a-8a55-0d3c9f2b7e10',
  ownerId: null,
  createdAt: '2026-09-01T14:23:11.000Z',
  updatedAt: '2026-09-01T14:23:11.000Z',
  tool: { key: 'vscode', title: 'Visual Studio Code' },
};

const PARAM_ID = {
  name: 'id',
  format: 'uuid',
  description: 'Id del atajo. Si no es un uuid valido, responde 400.',
  example: '3f1a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
};

@ApiTags('shortcuts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
@UseGuards(JwtAuthGuard)
@Controller('shortcuts')
export class ShortcutsController {
  constructor(private readonly shortcuts: ShortcutsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar atajos visibles',
    description:
      'Devuelve los del catalogo global (ownerId null) mas los tuyos. Los de otros usuarios nunca aparecen. Filtros opcionales por tool y level.',
  })
  @ApiOkResponse({
    description: 'Ordenados por level y despues por description.',
    schema: { example: [EJEMPLO_ATAJO] },
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filtros: QueryShortcutsDto,
  ) {
    return this.shortcuts.findAll(userId, filtros);
  }

  // Antes de :id, si no Nest toma "random" como un id.
  @Get('random')
  @ApiOperation({
    summary: 'Pedir un atajo al azar',
    description:
      'El endpoint del entrenamiento: te da UN atajo para mostrarle al usuario. Pasale exclude con el id anterior para no repetir.',
  })
  @ApiOkResponse({
    description: 'Un solo atajo, no un array.',
    schema: { example: EJEMPLO_ATAJO },
  })
  @ApiNotFoundResponse({ description: 'No hay ningun atajo con esos filtros.' })
  findRandom(
    @CurrentUser('id') userId: string,
    @Query() filtros: RandomShortcutDto,
  ) {
    return this.shortcuts.findRandom(userId, filtros);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ver un atajo puntual',
    description:
      'Solo si es global o tuyo. El de otro usuario responde 404, no 403.',
  })
  @ApiParam(PARAM_ID)
  @ApiOkResponse({ schema: { example: EJEMPLO_ATAJO } })
  @ApiNotFoundResponse({ description: 'No existe, o es de otro usuario.' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shortcuts.findOne(userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un atajo propio',
    description:
      'Queda con tu ownerId, asi que solo lo ves vos. En tool mandas la key, no el id: la API la resuelve.',
  })
  @ApiCreatedResponse({
    description: 'Atajo creado, con la tool ya incluida.',
    schema: {
      example: {
        ...EJEMPLO_ATAJO,
        ownerId: '316a7c2e-5b8d-4a91-9c33-7e2f6b1d0a44',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'La tool que mandaste no existe.' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShortcutDto) {
    return this.shortcuts.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar un atajo propio',
    description:
      'Mandas solo los campos que cambian, no hace falta el objeto entero. Los del catalogo global no se editan.',
  })
  @ApiParam(PARAM_ID)
  @ApiOkResponse({
    description: 'Atajo actualizado.',
    schema: { example: EJEMPLO_ATAJO },
  })
  @ApiForbiddenResponse({
    description: 'Es del catalogo global y no se puede editar.',
  })
  @ApiNotFoundResponse({ description: 'No existe, o es de otro usuario.' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShortcutDto,
  ) {
    return this.shortcuts.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Borrar un atajo propio',
    description:
      'Se borran en cascada los intentos asociados. No se puede deshacer.',
  })
  @ApiParam(PARAM_ID)
  @ApiNoContentResponse({ description: 'Borrado. No devuelve body.' })
  @ApiForbiddenResponse({
    description: 'Es del catalogo global y no se puede borrar.',
  })
  @ApiNotFoundResponse({ description: 'No existe, o es de otro usuario.' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shortcuts.remove(userId, id);
  }
}
