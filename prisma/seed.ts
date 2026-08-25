import { PrismaClient } from '@prisma/client';
import { canonicalCombo } from '../src/shortcuts/keys.util';
import { SHORTCUTS, TOOLS } from './catalogo';

const prisma = new PrismaClient();

async function main() {
  for (const tool of TOOLS) {
    await prisma.tool.upsert({
      where: { key: tool.key },
      update: tool,
      create: tool,
    });
  }
  console.log(`Herramientas: ${TOOLS.length}`);

  const yaCargados = await prisma.shortcut.count({ where: { ownerId: null } });
  if (yaCargados > 0) {
    console.log(`Catálogo ya cargado (${yaCargados} atajos), no se toca.`);
    return;
  }

  const tools = await prisma.tool.findMany();
  const idPorKey = new Map(tools.map((t) => [t.key, t.id]));

  const data = SHORTCUTS.map(([tool, level, description, expected]) => {
    const toolId = idPorKey.get(tool);
    if (!toolId) throw new Error(`La herramienta "${tool}" no existe`);
    return { toolId, level, description, expected: canonicalCombo(expected) };
  });

  const { count } = await prisma.shortcut.createMany({ data });
  console.log(`Atajos: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
