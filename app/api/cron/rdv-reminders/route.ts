import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendRdvReminderEmail } from '@/lib/email';
import { ADMIN_EMAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Rappels de rendez-vous : 1 h avant et 15 min avant.
 * Destinataires : le commercial à qui la mission est assignée + l'admin.
 *
 * À appeler toutes les 5 minutes. Le plan Vercel Hobby ne permettant qu'une
 * exécution par jour, on déclenche depuis un service externe (cron-job.org)
 * avec le secret en en-tête `Authorization: Bearer <CRON_SECRET>` ou en
 * paramètre `?secret=<CRON_SECRET>`.
 *
 * Idempotent : chaque rappel envoyé laisse une trace dans CronLog, donc un
 * appel répété n'enverra jamais deux fois le même rappel.
 */

const LEADS = [
  { minutes: 60, label: 'dans 1 heure', from: 50, to: 65 },
  { minutes: 15, label: 'dans 15 minutes', from: 6, to: 18 },
];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });

  const url = new URL(req.url);
  const provided = req.headers.get('authorization')?.replace('Bearer ', '') || url.searchParams.get('secret');
  if (provided !== secret) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const now = new Date();
  const horizon = new Date(now.getTime() + 70 * 60000);

  const prospects = await prisma.prospect.findMany({
    where: {
      rdvDate: { gte: now, lte: horizon },
      status: { in: ['VISIO_PLANIFIEE', 'INTERESSE', 'DEVIS_ENVOYE'] },
    },
    select: {
      id: true, company: true, contact: true, phone: true, note: true, rdvDate: true,
      mission: {
        select: {
          id: true, name: true, status: true,
          assignedTo: { select: { name: true, email: true } },
        },
      },
    },
  });

  let sent = 0;
  const details: string[] = [];

  for (const p of prospects) {
    if (!p.rdvDate || p.mission.status !== 'ACTIVE') continue;
    const minutesUntil = (p.rdvDate.getTime() - now.getTime()) / 60000;

    for (const lead of LEADS) {
      if (minutesUntil < lead.from || minutesUntil > lead.to) continue;

      const marker = `rdv-reminder:${p.id}:${lead.minutes}:${p.rdvDate.toISOString()}`;
      const already = await prisma.cronLog.findFirst({ where: { jobName: marker } });
      if (already) continue;

      const to = Array.from(new Set([p.mission.assignedTo?.email, ADMIN_EMAIL].filter(Boolean) as string[]));
      const ok = await sendRdvReminderEmail({
        to,
        leadLabel: lead.label,
        company: p.company,
        contact: p.contact,
        phone: p.phone,
        note: p.note,
        missionId: p.mission.id,
        missionName: p.mission.name,
        rdvDate: p.rdvDate,
        commercialName: p.mission.assignedTo?.name || null,
      });

      // Trace posée même en cas d'échec d'envoi : on ne boucle pas sur une
      // adresse invalide toutes les 5 minutes.
      await prisma.cronLog.create({
        data: { jobName: marker, success: ok, message: `${p.company} — ${lead.label} — ${to.join(', ')}`, emailsSent: ok ? 1 : 0 },
      });
      if (ok) { sent++; details.push(`${p.company} (${lead.minutes} min)`); }
    }
  }

  const summary = { checked: prospects.length, sent, details, at: now.toISOString() };
  await prisma.cronLog.create({
    data: { jobName: 'rdv-reminders', success: true, message: `${sent} rappel(s) envoyé(s) sur ${prospects.length} RDV à venir`, emailsSent: sent },
  });

  return NextResponse.json(summary);
}
