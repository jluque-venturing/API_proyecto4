import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { ShortcutsController } from './shortcuts.controller';
import { ShortcutsService } from './shortcuts.service';

@Module({
  imports: [ToolsModule],
  controllers: [ShortcutsController],
  providers: [ShortcutsService],
  exports: [ShortcutsService],
})
export class ShortcutsModule {}
