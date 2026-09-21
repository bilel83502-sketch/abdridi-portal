/**
 * Synchronisation manuelle simap.ch (marchés publics suisses)
 * Usage : npx tsx scripts/sync-simap.ts [--days=30] [--limit=500] [--debug] [--dry-run]
 *
 *   --debug    affiche la structure brute renvoyée par simap (utile la 1re fois)
 *   --dry-run  n'écrit rien en base, affiche seulement ce qui serait importé
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import { fetchSimapProjects, enrichSimapDetails, toMarcheRecord } from '../lib/simap';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const get = (k: string, d: number) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? parseInt(a.split('=')[1]) : d; };
  const daysBack = get('days', 30);
  const limit = get('limit', 500);
  const debug = args.includes('--debug');
  const dryRun = args.includes('--dry-run');

  console.log(`[SIMAP] Récupération des appels d'offres des ${daysBack} derniers jours (max ${limit})...`);
  const projects = await fetchSimapProjects({ daysBack, limit, debug });
  if (debug) {
    // Copie brute dans un fichier pour analyse (non commité)
    const fs = await import('fs');
    fs.writeFileSync('simap-debug.json', JSON.stringify({ firstProject: (projects[0] as any), note: 'voir console pour le détail brut' }, null, 2));
  }

  if (projects.length === 0) { console.log('Aucun résultat.'); return; }

  // Détail sur les premiers pour valider le mapping (délai, CPV)
  const sample = Math.min(projects.length, debug ? 1 : 25);
  for (let i = 0; i < sample; i++) await enrichSimapDetails(projects[i], debug && i === 0);

  console.log('\n─── Aperçu ───');
  for (const p of projects.slice(0, 10)) {
    console.log(`• [${p.department}] ${p.title.slice(0, 70)}`);
    console.log(`    ${p.buyer.slice(0, 60)} · ${p.nature} · délai ${p.deadline ? p.deadline.toLocaleDateString('fr-FR') : '—'} · CPV ${p.cpvCode || '—'}`);
  }

  if (dryRun) { console.log(`\n(dry-run) ${projects.length} marchés non écrits.`); return; }

  let upserted = 0, skipped = 0;
  for (const p of projects) {
    const record = toMarcheRecord(p);
    try {
      await prisma.marche.upsert({
        where: { sourceRef: record.sourceRef },
        update: {
          title: record.title, buyer: record.buyer, nature: record.nature,
          department: record.department, departmentName: record.departmentName, region: record.region,
          procedureType: record.procedureType, documents: record.documents,
          ...(record.deadline ? { deadline: record.deadline } : {}),
          ...(record.cpvCode ? { cpvCode: record.cpvCode, cpvLabel: record.cpvLabel } : {}),
        },
        create: record,
      });
      upserted++;
    } catch (e: any) {
      skipped++;
      if (debug) console.warn('  échec', record.sourceRef, e?.message);
    }
  }
  console.log(`\n✅ ${upserted} marchés suisses importés/mis à jour, ${skipped} ignorés.`);
}

main().catch(e => { console.error('Erreur :', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
