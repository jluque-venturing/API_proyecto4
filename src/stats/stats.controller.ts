import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.stats.resumenGlobal(userId);
  }

  @Get('me/tools/:key')
  porTool(@CurrentUser('id') userId: string, @Param('key') key: string) {
    return this.stats.resumenPorTool(userId, key);
  }
}
