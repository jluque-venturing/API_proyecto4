import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import { resumir } from './stats.util';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tools: ToolsService,
  ) {}

  async resumenGlobal(userId: string) {
    const [intentos, totalShortcuts] = await Promise.all([
      this.intentos(userId),
      this.cuantosAtajos(userId),
    ]);

    return { ...resumir(intentos), totalShortcuts };
  }

  async resumenPorTool(userId: string, key: string) {
    const tool = await this.tools.findByKey(key);
    const [intentos, totalShortcuts] = await Promise.all([
      this.intentos(userId, tool.id),
      this.cuantosAtajos(userId, tool.id),
    ]);

    return {
      tool: { key: tool.key, title: tool.title },
      ...resumir(intentos),
      totalShortcuts,
    };
  }

  private intentos(userId: string, toolId?: string) {
    return this.prisma.attempt.findMany({
      where: { userId, ...(toolId ? { shortcut: { toolId } } : {}) },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { isCorrect: true, responseTimeMs: true, shortcutId: true },
    });
  }

  private cuantosAtajos(userId: string, toolId?: string) {
    return this.prisma.shortcut.count({
      where: {
        OR: [{ ownerId: null }, { ownerId: userId }],
        ...(toolId ? { toolId } : {}),
      },
    });
  }
}
