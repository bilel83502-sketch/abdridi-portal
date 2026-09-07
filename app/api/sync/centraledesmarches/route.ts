/**
 * Route cron : /api/sync/centraledesmarches
 * Schedule : 5h15 UTC chaque jour (cf. vercel.json)
 *
 * Pulls les AO transport depuis centraledesmarches.com (Medialex/Ouest-France).
 * Cible : +600 à +1 000 AO transport (CPV 60+34+50.1+63 cumulés) — comble
 * en grande partie le gap concurrentiel constaté vs CDM (1062 vs 498).
 *
 * NB : la fonction `fetchCentraleDesMarchesRecords` retourne actuellement 0
 * résultat tant que les sélecteurs CSS du parseur n'ont pas été validés.
 * Tester en local d'abord :
 *   npx tsx scripts/sync-centraledesmarches.ts --debug --limit=10
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchCentraleDesMarchesRecords } from '@/lib/centraledesmarches';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const SOURCE = 'CENTRALE_DES_MARCHES';

export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { summary } = await withCronLogging('sync-centraledesmarches', async () => {
      // Récupération multi-passes : on parcourt plusieurs requêtes mot-clé
      // pour maximiser la couverture transport. Mots-clés cohérents avec
      // lib/sectors.ts (Sprint 1 Acquisition).
      const keywordPasses = [
        'transport',
        'logistique',
        'collecte',
        'déchets',
        'navette',
        'autocar',
        'fret',
        'coursier',
        'ambulance',
      ];

      const seen = new Set<string>();
      const allRecords: Array<{
        title: string; buyer: string; nature: string;
        department: string; departmentName?: string | null; region?: string | null;
        deadline?: Date | null; publicationDate?: Date | null;
        source: string; sourceRef: string;
        cpvCode?: string | null; cpvLabel?: string | null;
        documents?: any;
      }> = [];

      for (const kw of keywordPasses) {
        const records = await fetchCentraleDesMarchesRecords({
          keywords: kw,
          status: 2, // AO ouverts
          maxPages: 25,
        });
        for (const r of records) {
          if (seen.has(r.sourceRef)) continue;
          seen.add(r.sourceRef);
          allRecords.push({
            title: r.title,
            buyer: r.buyer,
            nature: r.nature,
            department: r.department,
            departmentName: r.departmentName || null,
            region: r.region || null,
            deadline: r.deadline,
            publicationDate: r.publicationDate,
            source: SOURCE,
            sourceRef: r.sourceRef,
            cpvCode: r.cpvCode,
            cpvLabel: r.cpvLabel,
            documents: r.detailUrl ? [{ name: 'Voir sur Centrale des Marchés', url: r.detailUrl, type: 'link' }] : undefined,
          });
        }
      }

      let upserted = 0;
      let skipped = 0;

      const BATCH_SIZE = 50;
      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batch = allRecords.slice(i, i + BATCH_SIZE);
        const ops = batch
          .filter((r) => r.sourceRef)
          .map((record) =>
            prisma.marche.upsert({
              where: { sourceRef: record.sourceRef },
              update: {
                title: record.title,
                buyer: record.buyer,
                nature: record.nature,
                department: record.department,
                departmentName: record.departmentName,
                region: record.region,
                deadline: record.deadline,
                publicationDate: record.publicationDate,
                cpvCode: record.cpvCode,
                cpvLabel: record.cpvLabel,
                documents: record.documents,
              },
              create: record as any,
            }),
          );

        try {
          const results = await prisma.$transaction(ops);
          upserted += results.length;
        } catch {
          for (const record of batch) {
            if (!record.sourceRef) {
              skipped++;
              continue;
            }
            try {
              await prisma.marche.upsert({
                where: { sourceRef: record.sourceRef },
                update: {
                  title: record.title,
                  buyer: record.buyer,
                  nature: record.nature,
                  department: record.department,
                  departmentName: record.departmentName,
                  region: record.region,
                  deadline: record.deadline,
                  publicationDate: record.publicationDate,
                  cpvCode: record.cpvCode,
                  cpvLabel: record.cpvLabel,
                  documents: record.documents,
                },
                create: record as any,
              });
              upserted++;
            } catch {
              skipped++;
            }
          }
        }
      }

      // Bascule en FERME les AO CDM dont la deadline est passée
      const expired = await prisma.marche.updateMany({
        where: {
          source: SOURCE,
          status: 'OUVERT',
          deadline: { lt: new Date() },
        },
        data: { status: 'FERME' },
      });

      return {
        total: allRecords.length,
        upserted,
        skipped,
        expired: expired.count,
        syncedAt: new Date().toISOString(),
      };
    });

    console.log('[CENTRALE_DES_MARCHES] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[CENTRALE_DES_MARCHES] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 },
    );
  }
}
