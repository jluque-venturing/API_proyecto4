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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShortcutDto } from './dto/create-shortcut.dto';
import { QueryShortcutsDto, RandomShortcutDto } from './dto/query-shortcuts.dto';
import { UpdateShortcutDto } from './dto/update-shortcut.dto';
import { ShortcutsService } from './shortcuts.service';

@ApiTags('shortcuts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shortcuts')
export class ShortcutsController {
  constructor(private readonly shortcuts: ShortcutsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filtros: QueryShortcutsDto,
  ) {
    return this.shortcuts.findAll(userId, filtros);
  }

  // Antes de :id, si no Nest toma "random" como un id.
  @Get('random')
  findRandom(
    @CurrentUser('id') userId: string,
    @Query() filtros: RandomShortcutDto,
  ) {
    return this.shortcuts.findRandom(userId, filtros);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shortcuts.findOne(userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShortcutDto) {
    return this.shortcuts.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShortcutDto,
  ) {
    return this.shortcuts.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shortcuts.remove(userId, id);
  }
}
