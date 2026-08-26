import { Injectable } from '@nestjs/common';
import { TrainingMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { canonicalCombo, matchesCombo } from '../shortcuts/keys.util';
import { ShortcutsService } from '../shortcuts/shortcuts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { QueryAttemptsDto } from './dto/query-attempts.dto';

const HISTORIAL_POR_DEFECTO = 20;

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shortcuts: ShortcutsService,
  ) {}

  async create(userId: string, dto: CreateAttemptDto) {
    const atajo = await this.shortcuts.findOne(userId, dto.shortcutId);
    const isCorrect = matchesCombo(dto.pressed, atajo.expected);

    const intento = await this.prisma.attempt.create({
      data: {
        userId,
        shortcutId: atajo.id,
        pressed: canonicalCombo(dto.pressed),
        isCorrect,
        responseTimeMs: dto.responseTimeMs,
        mode: dto.mode ?? TrainingMode.GUESS,
      },
    });

    return {
      id: intento.id,
      isCorrect,
      pressed: intento.pressed,
      expected: atajo.expected,
      description: atajo.description,
      responseTimeMs: intento.responseTimeMs,
      currentStreak: await this.rachaActual(userId),
      createdAt: intento.createdAt,
    };
  }

  findAll(userId: string, { tool, limit }: QueryAttemptsDto) {
    return this.prisma.attempt.findMany({
      where: {
        userId,
        ...(tool ? { shortcut: { tool: { key: tool } } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit ?? HISTORIAL_POR_DEFECTO,
      include: {
        shortcut: {
          select: {
            description: true,
            expected: true,
            level: true,
            tool: { select: { key: true, title: true } },
          },
        },
      },
    });
  }

  async removeAll(userId: string) {
    const { count } = await this.prisma.attempt.deleteMany({ where: { userId } });
    return count;
  }

  private async rachaActual(userId: string) {
    const ultimos = await this.prisma.attempt.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: { isCorrect: true },
    });

    let racha = 0;
    for (const intento of ultimos) {
      if (!intento.isCorrect) break;
      racha++;
    }
    return racha;
  }
}
