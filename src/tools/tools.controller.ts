import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ToolsService } from './tools.service';

@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  @Get()
  findAll() {
    return this.tools.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.tools.findByKey(key);
  }
}
