import { Module } from '@nestjs/common';
import { ShortcutsController } from './shortcuts.controller';
import { ShortcutsService } from './shortcuts.service';

@Module({
  controllers: [ShortcutsController],
  providers: [ShortcutsService],
  exports: [ShortcutsService],
})
export class ShortcutsModule {}
