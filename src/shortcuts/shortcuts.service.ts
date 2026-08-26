import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryShortcutsDto, RandomShortcutDto } from './dto/query-shortcuts.dto';

const CON_TOOL = { tool: { select: { key: true, title: true } } };

@Injectable()
export class ShortcutsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, filtros: QueryShortcutsDto) {
    return this.prisma.shortcut.findMany({
      where: this.visibles(userId, filtros),
      orderBy: [{ level: 'asc' }, { description: 'asc' }],
      include: CON_TOOL,
    });
  }

  async findOne(userId: string, id: string) {
    const atajo = await this.prisma.shortcut.findFirst({
      where: { id, OR: [{ ownerId: null }, { ownerId: userId }] },
      include: CON_TOOL,
    });
    if (!atajo) throw new NotFoundException('No existe ese atajo');
    return atajo;
  }

  async findRandom(userId: string, { exclude, ...filtros }: RandomShortcutDto) {
    const base = this.visibles(userId, filtros);

    let where: Prisma.ShortcutWhereInput = exclude
      ? { ...base, id: { not: exclude } }
      : base;
    let total = await this.prisma.shortcut.count({ where });

    // Si el unico candidato era el excluido, se repite antes que devolver vacio.
    if (total === 0 && exclude) {
      where = base;
      total = await this.prisma.shortcut.count({ where });
    }
    if (total === 0) throw new NotFoundException('No hay atajos con esos filtros');

    const [atajo] = await this.prisma.shortcut.findMany({
      where,
      skip: Math.floor(Math.random() * total),
      take: 1,
      include: CON_TOOL,
    });
    return atajo;
  }

  private visibles(
    userId: string,
    { tool, level }: QueryShortcutsDto,
  ): Prisma.ShortcutWhereInput {
    return {
      OR: [{ ownerId: null }, { ownerId: userId }],
      ...(tool ? { tool: { key: tool } } : {}),
      ...(level ? { level } : {}),
    };
  }
}
