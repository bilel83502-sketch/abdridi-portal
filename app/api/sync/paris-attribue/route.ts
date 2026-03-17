import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchParisBatch } from '@/lib/paris-attribue';
import { type AttribueRecord } from '@/lib/decp-attribue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

async function upsertRecords(records: AttribueRecord[]) {
  let upserted = 0;
  let skipped = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const ops = batch
      .filter((r) => r.sourceRef)
      .map((record) =>
        prisma.marcheAttribue.upsert({
          where: { sourceRef: record.sourceRef },
          update: {
            objet: record.objet,
            acheteurNom: record.acheteurNom,
            acheteurSiret: record.acheteurSiret,
            titulaireNom: record.titulaireNom,
            titulaireSiret: record.titulaireSiret,
            titulaireCommune: record.titulaireCommune,
            montant: record.montant,
            dateNotification: record.dateNotification,
            datePublicationDonnees: record.datePublicationDonnees,
            nature: record.nature,
            procedure: record.procedure,
            lieuExecution: record.lieuExecution,
            departement: record.departement,
            departementNom: record.departementNom,
            region: record.region,
            codeCPV: record.codeCPV,
            labelCPV: record.labelCPV,
            dureeMois: record.dureeMois,
            formePrix: record.formePrix,
          },
          create: record,
        })
      );

    try {
      const results = await prisma.$transaction(ops);
      upserted += results.length;
    } catch {
      for (const record of batch) {
        if (!record.sourceRef) { skipped++; continue; }
        try {
          await prisma.marcheAttribue.upsert({
            where: { sourceRef: record.sourceRef },
            update: { objet: record.objet, acheteurNom: record.acheteurNom, titulaireNom: record.titulaireNom, nature: record.nature },
            create: record,
          });
          upserted++;
        } catch { skipped++; }
      }
    }
  }

  return { upserted, skipped };
}

export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageNum = parseInt(searchParams.get('page') || '0');
  const batchSize = 500;

  try {
    const records = await fetchParisBatch({
      limit: batchSize,
      startOffset: pageNum * batchSize,
    });

    const { upserted, skipped } = await upsertRecords(records);
    const total = await prisma.marcheAttribue.count();

    const summary = {
      source: 'PARIS',
      page: pageNum,
      offsetRange: `${pageNum * batchSize}-${pageNum * batchSize + records.length}`,
      fetched: records.length,
      upserted,
      skipped,
      totalInDb: total,
      syncedAt: new Date().toISOString(),
    };

    console.log('[PARIS] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[PARIS] Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed', message: error?.message }, { status: 500 });
  }
}
