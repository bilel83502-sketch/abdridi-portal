import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Get all distinct job names
  const jobNames = await prisma.cronLog.findMany({
    distinct: ['jobName'],
    select: { jobName: true },
    where: { jobName: { not: { startsWith: 'rl:' } } },
  });

  let alertsSent = 0;

  for (const { jobName } of jobNames) {
    // Get last 3 executions
    const lastThree = await prisma.cronLog.findMany({
      where: { jobName },
      orderBy: { executedAt: 'desc' },
      take: 3,
      select: { id: true, success: true, message: true, executedAt: true },
    });

    if (lastThree.length < 3) continue;

    // Check if all 3 failed
    const allFailed = lastThree.every(l => !l.success);
    if (!allFailed) continue;

    // Check if we already alerted for the most recent failure
    const latestMsg = lastThree[0].message || '';
    if (latestMsg.includes('"alerted":true')) continue;

    // Get last successful execution
    const lastSuccess = await prisma.cronLog.findFirst({
      where: { jobName, success: true },
      orderBy: { executedAt: 'desc' },
      select: { executedAt: true },
    });

    // Send alert email
    try {
      await resend.emails.send({
        from: 'AB DRIDI <noreply@abdridi.com>',
        to: 'contact@abdridi.com',
        subject: `[ALERTE] Cron "${jobName}" en échec depuis 3 exécutions`,
        html: `
          <h2>⚠️ Cron en échec répété</h2>
          <p><strong>Job :</strong> ${jobName}</p>
          <p><strong>3 dernières erreurs :</strong></p>
          <ul>
            ${lastThree.map(l => `<li>${new Date(l.executedAt).toLocaleString('fr-FR')} — ${l.message || 'Pas de message'}</li>`).join('')}
          </ul>
          <p><strong>Dernière réussite :</strong> ${lastSuccess ? new Date(lastSuccess.executedAt).toLocaleString('fr-FR') : 'Jamais'}</p>
          <p><a href="https://portal.abdridi.com/pilotage/logs">Voir les logs</a></p>
        `,
      });
      alertsSent++;
    } catch (e) {
      console.error(`[CHECK-CRON] Failed to send alert for ${jobName}:`, e);
    }

    // Mark latest as alerted
    try {
      const existingMsg = lastThree[0].message ? JSON.parse(lastThree[0].message) : {};
      await prisma.cronLog.update({
        where: { id: lastThree[0].id },
        data: { message: JSON.stringify({ ...existingMsg, alerted: true }) },
      });
    } catch {
      // If message isn't valid JSON, just set it
      await prisma.cronLog.update({
        where: { id: lastThree[0].id },
        data: { message: JSON.stringify({ originalMessage: lastThree[0].message, alerted: true }) },
      });
    }
  }

  return NextResponse.json({ checked: jobNames.length, alertsSent });
}
