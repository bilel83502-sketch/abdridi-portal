/**
 * db-size — Diagnostic de l'occupation disque de la base Neon.
 *
 * Répond à la question : "pourquoi je ne peux plus créer de mission ?"
 * Le plan Neon Free est limité à 0,5 Go. Au-delà, la base passe en lecture
 * seule et TOUTE écriture échoue (création de mission incluse).
 *
 * Usage :
 *   npx tsx scripts/db-size.ts
 */
import { config } from 'dotenv';

// Les imports ESM sont evalues avant cette ligne : Prisma a donc deja pu charger
// le .env du projet (qui contient une URL factice host:5432). override:true
// garantit que .env.local a le dernier mot.
config({ path: '.env.local', override: true });

const DB = process.env.DATABASE_URL || '';
if (!DB || /@host:|@localhost|\/\/host:/.test(DB)) {
  console.error('\nErreur de configuration : DATABASE_URL pointe vers une adresse factice');
  console.error(`  valeur lue : ${DB.replace(/:\/\/[^@]*@/, '://***@') || '(vide)'}`);
  console.error('  Verifiez que .env.local existe a la racine du projet et contient');
  console.error('  la vraie DATABASE_URL Neon. Le fichier .env, lui, contient un');
  console.error('  gabarit qui ne doit pas servir.\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FREE_TIER_BYTES = 0.5 * 1024 ** 3;

function fmt(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

async function main() {
  const [{ size }] = await prisma.$queryRawUnsafe<{ size: bigint }[]>(
    `SELECT pg_database_size(current_database()) AS size`
  );
  const total = Number(size);
  const pct = (total / FREE_TIER_BYTES) * 100;

  console.log('\n═══ OCCUPATION BASE DE DONNÉES ═══\n');
  console.log(`  Taille totale     : ${fmt(total)}`);
  console.log(`  Quota Neon Free   : ${fmt(FREE_TIER_BYTES)}`);
  console.log(`  Utilisé           : ${pct.toFixed(1)} %`);
  if (pct >= 95) {
    console.log('\n  ⚠️  CRITIQUE — la base est saturée.');
    console.log('     Les écritures (création de mission) vont échouer.');
  } else if (pct >= 80) {
    console.log('\n  ⚠️  Attention — seuil d\'alerte dépassé.');
  } else {
    console.log('\n  ✅ Marge suffisante.');
  }

  const tables = await prisma.$queryRawUnsafe<
    { table_name: string; total_bytes: bigint }[]
  >(`
    SELECT c.relname AS table_name,
           pg_total_relation_size(c.oid) AS total_bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 20
  `);

  console.log('\n═══ TOP 20 TABLES ═══\n');
  console.log('  ' + 'TABLE'.padEnd(24) + 'TAILLE'.padStart(12) + '   PART');
  console.log('  ' + '─'.repeat(48));
  for (const t of tables) {
    const b = Number(t.total_bytes);
    const share = total > 0 ? ((b / total) * 100).toFixed(1) + ' %' : '—';
    console.log('  ' + t.table_name.padEnd(24) + fmt(b).padStart(12) + '   ' + share);
  }

  // Poids réel des pièces jointes stockées en base64 dans MissionDocument
  const docs = await prisma.missionDocument.aggregate({
    _count: { _all: true },
    _sum: { size: true },
  });

  console.log('\n═══ PIÈCES JOINTES STOCKÉES EN BASE ═══\n');
  console.log(`  Documents         : ${docs._count._all}`);
  console.log(`  Poids fichiers    : ${fmt(docs._sum.size ?? 0)}`);
  console.log(`  Poids en base     : ~${fmt((docs._sum.size ?? 0) * 1.37)} (base64 = +37 %)`);
  console.log('\n  → Ces fichiers sont stockés dans la colonne MissionDocument.fileData.');
  console.log('    Les externaliser (Vercel Blob / S3) libérerait cet espace.');

  const missions = await prisma.mission.count();
  const prospects = await prisma.prospect.count();
  console.log('\n═══ VOLUMÉTRIE MÉTIER ═══\n');
  console.log(`  Missions          : ${missions}`);
  console.log(`  Prospects         : ${prospects}`);
  console.log('');
}

main()
  .catch((e) => { console.error('Erreur :', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
