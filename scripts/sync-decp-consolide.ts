/**
 * Script d'import des fichiers DECP consolidés (data.gouv.fr)
 * Streaming JSON pour gérer des fichiers jusqu'à 649 MB
 * Utilise INSERT ... ON CONFLICT pour des upserts en batch (~100x plus rapide)
 *
 * Usage :
 *   npx tsx scripts/sync-decp-consolide.ts --from=2024
 *   npx tsx scripts/sync-decp-consolide.ts --years=2024,2025,2026
 *   npx tsx scripts/sync-decp-consolide.ts --months=2026-03,2026-02
 *   npx tsx scripts/sync-decp-consolide.ts --from=2024 --dry-run --batch=500
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import {
  fetchDecpFileUrls,
  streamDecpFile,
  type MarcheAttribueInput,
} from '../lib/decp-consolide';

function loadEnv() {
  const envLocal = resolve(process.cwd(), '.env.local');
  try {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="([^"]*)"/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)='([^']*)'/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a cuid-like ID */
function genId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rand}`;
}

/**
 * Batch upsert using INSERT ... ON CONFLICT (sourceRef)
 * ~100x faster than individual Prisma queries
 */
async function batchUpsert(
  prisma: PrismaClient,
  records: MarcheAttribueInput[]
): Promise<{ created: number; updated: number; skipped: number }> {
  // Filter out records without sourceRef and deduplicate by sourceRef within batch
  const seen = new Set<string>();
  const valid: MarcheAttribueInput[] = [];
  for (const r of records) {
    if (!r.sourceRef || seen.has(r.sourceRef)) continue;
    seen.add(r.sourceRef);
    valid.push(r);
  }
  if (valid.length === 0) return { created: 0, updated: 0, skipped: records.length };

  // Build parameterized values
  const cols = [
    'id', 'objet', '"acheteurNom"', '"acheteurSiret"', '"titulaireNom"',
    '"titulaireSiret"', '"titulaireCommune"', 'montant', '"dateNotification"',
    '"datePublicationDonnees"', 'nature', '"procedure"', '"lieuExecution"',
    'departement', '"departementNom"', 'region', '"codeCPV"', '"labelCPV"',
    'source', '"sourceRef"', '"dureeMois"', '"formePrix"', '"createdAt"',
  ];

  const params: any[] = [];
  const valuePlaceholders: string[] = [];
  let paramIdx = 1;

  for (const r of valid) {
    const placeholders: string[] = [];
    const values = [
      genId(),
      r.objet,
      r.acheteurNom,
      r.acheteurSiret,
      r.titulaireNom,
      r.titulaireSiret,
      r.titulaireCommune,
      r.montant,
      r.dateNotification,
      r.datePublicationDonnees,
      r.nature,
      r.procedure,
      r.lieuExecution,
      r.departement,
      r.departementNom,
      r.region,
      r.codeCPV,
      r.labelCPV,
      r.source,
      r.sourceRef,
      r.dureeMois,
      r.formePrix,
      new Date(),
    ];

    for (const v of values) {
      placeholders.push(`$${paramIdx++}`);
      params.push(v ?? null);
    }

    valuePlaceholders.push(`(${placeholders.join(',')})`);
  }

  const sql = `
    INSERT INTO "MarcheAttribue" (${cols.join(',')})
    VALUES ${valuePlaceholders.join(',\n')}
    ON CONFLICT ("sourceRef") DO UPDATE SET
      objet = EXCLUDED.objet,
      "acheteurNom" = EXCLUDED."acheteurNom",
      "acheteurSiret" = EXCLUDED."acheteurSiret",
      "titulaireNom" = EXCLUDED."titulaireNom",
      "titulaireSiret" = EXCLUDED."titulaireSiret",
      "titulaireCommune" = EXCLUDED."titulaireCommune",
      montant = EXCLUDED.montant,
      "dateNotification" = EXCLUDED."dateNotification",
      "datePublicationDonnees" = EXCLUDED."datePublicationDonnees",
      nature = EXCLUDED.nature,
      "procedure" = EXCLUDED."procedure",
      "lieuExecution" = EXCLUDED."lieuExecution",
      departement = EXCLUDED.departement,
      "departementNom" = EXCLUDED."departementNom",
      region = EXCLUDED.region,
      "codeCPV" = EXCLUDED."codeCPV",
      "labelCPV" = EXCLUDED."labelCPV",
      "dureeMois" = EXCLUDED."dureeMois",
      "formePrix" = EXCLUDED."formePrix"
  `;

  const result: any = await (prisma as any).$executeRawUnsafe(sql, ...params);
  const total = valid.length;
  // Postgres returns the number of affected rows (inserts + updates)
  // We can't distinguish created vs updated from a single query, so we approximate
  const skipped = records.length - valid.length;
  return { created: total, updated: 0, skipped };
}

async function main() {
  loadEnv();

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    const args = process.argv.slice(2);
    const yearsArg = args.find((a) => a.startsWith('--years='));
    const monthsArg = args.find((a) => a.startsWith('--months='));
    const fromArg = args.find((a) => a.startsWith('--from='));
    const batchArg = args.find((a) => a.startsWith('--batch='));
    const dryRun = args.includes('--dry-run');

    const batchSize = batchArg ? parseInt(batchArg.split('=')[1]) : 500;

    console.log(`\n🔄 DECP Consolidé — Import streaming (batch upsert)`);
    if (dryRun) console.log('   ⚠ Mode dry-run : pas d\'écriture en BDD');
    console.log(`   Batch size : ${batchSize}\n`);

    // 1. Fetch available file URLs
    console.log('📡 Récupération des URLs depuis data.gouv.fr...');
    const fileMap = await fetchDecpFileUrls();
    console.log(`   ${fileMap.size} fichiers DECP trouvés\n`);

    if (fileMap.size === 0) {
      console.error('❌ Aucun fichier DECP trouvé');
      return;
    }

    // Get count before import
    const countBefore = await prisma.marcheAttribue.count();
    console.log(`📊 Marchés attribués en base avant import : ${countBefore}\n`);

    // 2. Select files based on CLI flags
    let selectedKeys: string[] = [];

    if (yearsArg) {
      selectedKeys = yearsArg.split('=')[1].split(',');
    } else if (monthsArg) {
      selectedKeys = monthsArg.split('=')[1].split(',');
    } else if (fromArg) {
      const fromYear = parseInt(fromArg.split('=')[1]);
      selectedKeys = Array.from(fileMap.keys())
        .filter((k) => {
          const year = parseInt(k.split('-')[0]);
          return year >= fromYear;
        });
    } else {
      selectedKeys = Array.from(fileMap.keys());
    }

    selectedKeys.sort();

    const availableKeys = selectedKeys.filter((k) => fileMap.has(k));
    if (availableKeys.length === 0) {
      console.error('❌ Aucun fichier correspondant aux critères');
      console.log('   Fichiers disponibles :', Array.from(fileMap.keys()).join(', '));
      return;
    }

    console.log(`📂 Fichiers sélectionnés : ${availableKeys.join(', ')}\n`);

    // 3. Process each file
    let totalUpserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < availableKeys.length; i++) {
      const key = availableKeys[i];
      const file = fileMap.get(key)!;
      console.log(`\n📥 [${i + 1}/${availableKeys.length}] decp-${key}.json (${file.sizeMb} MB)...`);

      let fileUpserted = 0;
      let fileSkipped = 0;
      let fileErrors = 0;
      let fileProcessed = 0;
      const fileStart = Date.now();

      try {
        await streamDecpFile(
          file.url,
          async (batch: MarcheAttribueInput[]) => {
            if (dryRun) {
              fileProcessed += batch.length;
              if (fileProcessed % 2000 < batchSize) {
                process.stdout.write(
                  `\r   [dry-run] ${fileProcessed} records parsés...`
                );
              }
              return;
            }

            try {
              const result = await batchUpsert(prisma, batch);
              fileUpserted += result.created;
              fileSkipped += result.skipped;
            } catch (e: any) {
              fileErrors += batch.length;
              if (fileErrors <= 3 * batchSize) {
                console.error(`\n   ⚠ Batch error: ${e?.message?.slice(0, 200)}`);
              }
            }

            fileProcessed += batch.length;
            if (fileProcessed % 2000 < batchSize) {
              const elapsed = ((Date.now() - fileStart) / 1000).toFixed(0);
              process.stdout.write(
                `\r   ${fileProcessed} records — upsertés: ${fileUpserted}, ignorés: ${fileSkipped} (${elapsed}s)`
              );
            }
          },
          batchSize
        );
      } catch (err: any) {
        console.error(`\n   ❌ Erreur sur decp-${key}.json: ${err.message}`);
      }

      const elapsed = ((Date.now() - fileStart) / 1000).toFixed(1);
      console.log(
        `\n   ✅ decp-${key}.json terminé en ${elapsed}s : ${fileProcessed} records (upsertés: ${fileUpserted}, ignorés: ${fileSkipped}, erreurs: ${fileErrors})`
      );

      totalUpserted += fileUpserted;
      totalSkipped += fileSkipped;
      totalErrors += fileErrors;

      if (i < availableKeys.length - 1) {
        console.log('   ⏳ Pause 2s...');
        await sleep(2000);
      }
    }

    // 4. Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ Import DECP Consolidé terminé`);
    console.log(`   📝 Upsertés   : ${totalUpserted}`);
    console.log(`   ⏭  Ignorés    : ${totalSkipped}`);
    console.log(`   ⚠  Erreurs    : ${totalErrors}`);

    if (!dryRun) {
      const total = await prisma.marcheAttribue.count();
      console.log(`\n📊 Marchés attribués en base : ${countBefore} → ${total} (+${total - countBefore})`);
    }
    console.log();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Erreur fatale :', e);
  process.exit(1);
});
