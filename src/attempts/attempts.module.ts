import { Module } from '@nestjs/common';
import { ShortcutsModule } from '../shortcuts/shortcuts.module';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

@Module({
  imports: [ShortcutsModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
