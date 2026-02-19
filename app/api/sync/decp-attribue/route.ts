import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllAttribueRecords } from '@/lib/decp-attribue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  try {
    // For cron: fetch 2000/source, 12 months (fits in 60s)
    const records = await fetchAllAttribueRecords({
      limitPerSource: 2000,
      monthsBack: 12,
    });

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
            });
            upserted++;
          } catch {
            skipped++;
          }
        }
      }
    }

    const total = await prisma.marcheAttribue.count();
    const summary = {
      fetched: records.length,
      upserted,
      skipped,
      totalInDb: total,
      syncedAt: new Date().toISOString(),
    };

    console.log('[ATTRIBUE] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[ATTRIBUE] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 }
    );
  }
}
