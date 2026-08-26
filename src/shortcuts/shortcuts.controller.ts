import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryShortcutsDto, RandomShortcutDto } from './dto/query-shortcuts.dto';
import { ShortcutsService } from './shortcuts.service';

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
}
