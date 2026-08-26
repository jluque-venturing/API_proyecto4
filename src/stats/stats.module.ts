import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [ToolsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
