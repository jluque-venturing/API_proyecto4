import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import { CreateShortcutDto } from './dto/create-shortcut.dto';
import { QueryShortcutsDto, RandomShortcutDto } from './dto/query-shortcuts.dto';
import { UpdateShortcutDto } from './dto/update-shortcut.dto';
import { canonicalCombo } from './keys.util';

const CON_TOOL = { tool: { select: { key: true, title: true } } };

@Injectable()
export class ShortcutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tools: ToolsService,
  ) {}

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

  async create(userId: string, dto: CreateShortcutDto) {
    const tool = await this.tools.findByKey(dto.tool);

    return this.prisma.shortcut.create({
      data: {
        description: dto.description,
        level: dto.level,
        expected: canonicalCombo(dto.expected),
        toolId: tool.id,
        ownerId: userId,
      },
      include: CON_TOOL,
    });
  }

  async update(userId: string, id: string, dto: UpdateShortcutDto) {
    await this.exigirPropio(userId, id);
    const tool = dto.tool ? await this.tools.findByKey(dto.tool) : null;

    return this.prisma.shortcut.update({
      where: { id },
      data: {
        description: dto.description,
        level: dto.level,
        expected: dto.expected ? canonicalCombo(dto.expected) : undefined,
        toolId: tool?.id,
      },
      include: CON_TOOL,
    });
  }

  async remove(userId: string, id: string) {
    await this.exigirPropio(userId, id);
    await this.prisma.shortcut.delete({ where: { id } });
  }

  private async exigirPropio(userId: string, id: string) {
    const atajo = await this.prisma.shortcut.findUnique({ where: { id } });
    if (!atajo) throw new NotFoundException('No existe ese atajo');

    if (atajo.ownerId === null) {
      throw new ForbiddenException('El catalogo global no se edita');
    }
    // Ajeno responde 404 y no 403: no revelar que el atajo de otro usuario existe.
    if (atajo.ownerId !== userId) {
      throw new NotFoundException('No existe ese atajo');
    }
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
