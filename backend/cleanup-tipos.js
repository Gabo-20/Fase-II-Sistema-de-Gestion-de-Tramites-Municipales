const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const todos = await prisma.tipoTramite.findMany({ orderBy: { id: 'asc' } });
  console.log('Tipos encontrados:', todos.length);
  todos.forEach(t => console.log(` - id:${t.id} "${t.nombre}"`));

  const vistos = new Map();
  for (const t of todos) {
    const key = t.nombre.toLowerCase().trim();
    if (vistos.has(key)) {
      try {
        await prisma.tipoTramite.delete({ where: { id: t.id } });
        console.log('Eliminado duplicado id:', t.id, '"' + t.nombre + '"');
      } catch {
        console.log('No se pudo eliminar id:', t.id, '(tiene solicitudes asociadas)');
      }
    } else {
      vistos.set(key, t.id);
    }
  }
  console.log('Listo');
  await prisma.$disconnect();
}
main();
