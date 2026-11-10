import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTrialEmail, sendTrialAdminDigest } from '@/lib/email';
import { withCronLogging } from '@/lib/cronLogger';
import { TRIAL_PLAN } from '@/lib/trial';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Cron quotidien de l'essai gratuit (5 semaines) :
 *  - J-7 et J-1 : email de rappel au client (fenêtres de 24 h → un seul envoi
 *    par client puisque le cron tourne une fois par jour) ;
 *  - fin d'essai : email + passage du compte en DECOUVERTE (idempotent :
 *    une fois repassé en DECOUVERTE, il n'est plus sélectionné) ;
 *  - récap admin : essais qui finissent sous 7 jours + essais terminés.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  const url = new URL(req.url);
  const provided = req.headers.get('authorization')?.replace('Bearer ', '') || url.searchParams.get('secret');
  if (provided !== secret) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { summary } = await withCronLogging('cron-trial', async () => {
    const now = new Date();
    const sel = { id: true, email: true, name: true, company: true, phone: true, stripeCurrentPeriodEnd: true } as const;
    const base = { role: 'USER', plan: TRIAL_PLAN };

    const [j7, j1, ended, endingSoon] = await Promise.all([
      prisma.user.findMany({ where: { ...base, stripeCurrentPeriodEnd: { gt: new Date(now.getTime() + 6 * DAY), lte: new Date(now.getTime() + 7 * DAY) } }, select: sel }),
      prisma.user.findMany({ where: { ...base, stripeCurrentPeriodEnd: { gt: now, lte: new Date(now.getTime() + DAY) } }, select: sel }),
      prisma.user.findMany({ where: { ...base, stripeCurrentPeriodEnd: { lte: now } }, select: sel, take: 200 }),
      prisma.user.findMany({ where: { ...base, stripeCurrentPeriodEnd: { gt: now, lte: new Date(now.getTime() + 7 * DAY) } }, select: sel, orderBy: { stripeCurrentPeriodEnd: 'asc' } }),
    ]);

    let sent = 0;
    for (const u of j7) if (await sendTrialEmail({ kind: 'J7', to: u.email, name: u.name, endsAt: u.stripeCurrentPeriodEnd! })) sent++;
    for (const u of j1) if (await sendTrialEmail({ kind: 'J1', to: u.email, name: u.name, endsAt: u.stripeCurrentPeriodEnd! })) sent++;

    for (const u of ended) {
      // On repasse d'abord en Découverte (évite un double envoi si l'email échoue puis le cron est relancé).
      await prisma.user.update({ where: { id: u.id }, data: { plan: 'DECOUVERTE', stripeCurrentPeriodEnd: null } });
      if (await sendTrialEmail({ kind: 'END', to: u.email, name: u.name, endsAt: u.stripeCurrentPeriodEnd! })) sent++;
    }

    await sendTrialAdminDigest({
      endingSoon: endingSoon.map(u => ({ name: u.name, email: u.email, company: u.company, phone: u.phone, endsAt: u.stripeCurrentPeriodEnd! })),
      ended: ended.map(u => ({ name: u.name, email: u.email, company: u.company, phone: u.phone })),
    });

    return { j7: j7.length, j1: j1.length, ended: ended.length, emailsSent: sent };
  });

  return NextResponse.json(summary);
}
