import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSimapProjects, enrichSimapDetails, toMarcheRecord } from '@/lib/simap';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

// Le détail (délai de dépôt, CPV) coûte un appel par marché : on ne le
// récupère que pour les nouveaux, et dans une limite compatible avec les
// 60 s d'exécution Vercel.
const MAX_DETAILS_PER_RUN = 40;

export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { summary } = await withCronLogging('sync-simap', async () => {
      const projects = await fetchSimapProjects({ daysBack: 30, limit: 500 });

      const refs = projects.map(p => p.sourceRef);
      const existing = await prisma.marche.findMany({
        where: { sourceRef: { in: refs } },
        select: { sourceRef: true, deadline: true },
      });
      const known = new Map(existing.map(e => [e.sourceRef, e]));

      // Détail pour les nouveaux (ou ceux encore sans délai), dans la limite
      let detailed = 0;
      for (const p of projects) {
        const k = known.get(p.sourceRef);
        if ((!k || !k.deadline) && detailed < MAX_DETAILS_PER_RUN) {
          await enrichSimapDetails(p);
          detailed++;
        }
      }

      let upserted = 0;
      let skipped = 0;
      for (const p of projects) {
        const record = toMarcheRecord(p);
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
              procedureType: record.procedureType,
              documents: record.documents,
              // On ne remplace pas un délai/CPV connu par du vide
              ...(record.deadline ? { deadline: record.deadline } : {}),
              ...(record.cpvCode ? { cpvCode: record.cpvCode, cpvLabel: record.cpvLabel } : {}),
              ...(record.value ? { value: record.value } : {}),
              ...(record.lots > 1 ? { lots: record.lots } : {}),
            },
            create: record,
          });
          upserted++;
        } catch {
          skipped++;
        }
      }

      const expired = await prisma.marche.updateMany({
        where: { source: 'SIMAP', status: 'OUVERT', deadline: { lt: new Date() } },
        data: { status: 'FERME' },
      });

      return {
        total: projects.length,
        newDetailed: detailed,
        upserted,
        skipped,
        expired: expired.count,
        syncedAt: new Date().toISOString(),
      };
    });

    console.log('[SIMAP] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[SIMAP] Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed', message: error?.message }, { status: 500 });
  }
}
