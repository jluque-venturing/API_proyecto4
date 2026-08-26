import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tool.findMany({ orderBy: { title: 'asc' } });
  }

  async findByKey(key: string) {
    const tool = await this.prisma.tool.findUnique({ where: { key } });
    if (!tool) throw new NotFoundException(`No existe la herramienta "${key}"`);
    return tool;
  }
}
