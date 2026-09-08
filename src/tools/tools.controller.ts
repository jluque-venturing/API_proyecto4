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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ToolsService } from './tools.service';

const EJEMPLO_TOOL = {
  id: 'b21f9d40-1c77-4e0a-8a55-0d3c9f2b7e10',
  key: 'vscode',
  title: 'Visual Studio Code',
  description: 'Editor de codigo de Microsoft',
  icon: 'vscode',
};

@ApiTags('tools')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el accessToken o vencio.' })
@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar las tools disponibles',
    description:
      'Empeza por aca: la key que devuelve es la que usas despues en los filtros tool= y al crear atajos.',
  })
  @ApiOkResponse({
    description: 'Ordenadas alfabeticamente por title.',
    schema: { example: [EJEMPLO_TOOL] },
  })
  findAll() {
    return this.tools.findAll();
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Ver una tool puntual',
    description: 'Se busca por key legible (vscode), no por uuid.',
  })
  @ApiParam({
    name: 'key',
    description: 'La key de la tool, en minusculas.',
    example: 'vscode',
  })
  @ApiOkResponse({ schema: { example: EJEMPLO_TOOL } })
  @ApiNotFoundResponse({ description: 'No existe una tool con esa key.' })
  findOne(@Param('key') key: string) {
    return this.tools.findByKey(key);
  }
}
