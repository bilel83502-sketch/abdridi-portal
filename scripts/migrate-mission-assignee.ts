/**
 * migrate-mission-assignee — Ajoute la colonne d'assignation des missions.
 *
 * Applique exactement le SQL de prisma/migrations/20260919_add_mission_assignee/
 * (idempotent : peut être relancé sans risque). Volontairement séparé d'un
 * `prisma db push` global pour ne toucher que ce changement précis et ne
 * pas risquer d'appliquer d'autres écarts accumulés entre schema.prisma et
 * la base de production.
 *
 * À exécuter AVANT de déployer le code qui utilise Mission.assignedToId.
 *
 * Usage : npx tsx scripts/migrate-mission-assignee.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const DB = process.env.DATABASE_URL || '';
if (!DB || /@host:|@localhost|\/\/host:/.test(DB)) {
  console.error('\nErreur de configuration : DATABASE_URL pointe vers une adresse factice.');
  console.error('Vérifiez que .env.local contient la vraie DATABASE_URL Neon.\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2
     ) AS "exists"`,
    table, column
  );
  return rows[0]?.exists ?? false;
}

async function main() {
  console.log('Vérification du schéma...');

  if (await columnExists('Mission', 'assignedToId')) {
    console.log('  ℹ️  La colonne Mission.assignedToId existe déjà — rien à faire.');
    await prisma.$disconnect();
    return;
  }

  console.log('Ajout de la colonne Mission.assignedToId...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Mission" ADD COLUMN "assignedToId" TEXT`);

  console.log('Ajout de l\'index...');
  await prisma.$executeRawUnsafe(`CREATE INDEX "Mission_assignedToId_idx" ON "Mission"("assignedToId")`);

  console.log('Ajout de la contrainte de clé étrangère vers User...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Mission"
      ADD CONSTRAINT "Mission_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  `);

  console.log('\n✅ Migration appliquée. Les missions non assignées ont assignedToId = NULL (comportement identique à avant).\n');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('\n❌ Erreur pendant la migration :', e.message);
  console.error('   Aucune donnée existante n\'a été modifiée par cet échec.\n');
  process.exit(1);
});
