import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Placeholder si la clé est absente : sans lui, `new Resend(undefined)` lève une
// exception au chargement du module et fait échouer TOUT le build Vercel.
// À l'exécution, sans vraie clé, l'envoi échoue proprement (erreur loggée).
const resend = new Resend(process.env.RESEND_API_KEY || 're_missing_key');
const FROM_EMAIL = 'AB DRIDI <noreply@abdridi.com>';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(v: number | null | undefined): string {
  if (!v) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function renderMarcheRow(m: any, isLast: boolean): string {
  return `<tr><td style="padding:14px 20px;${isLast ? '' : 'border-bottom:1px solid #E2E8F0;'}">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td>
        <a href="https://portal.abdridi.com/marches/${m.id}" style="font-size:14px;font-weight:600;color:#1A1A2E;text-decoration:none;line-height:1.4">${escapeHtml(m.title)}</a>
      </td></tr>
      <tr><td style="padding-top:5px">
        <span style="font-size:12px;color:#64748B"><strong style="color:#1A1A2E">Emetteur :</strong> ${escapeHtml(m.buyer)}</span><br>
        <span style="font-size:12px;color:#64748B"><strong style="color:#1A1A2E">Date limite :</strong> ${formatDate(m.deadline)} &nbsp;·&nbsp; <strong style="color:#1A1A2E">Source :</strong> <span style="color:#3B82F6;font-weight:500">${m.source}</span></span>
        ${m.value ? `<br><span style="font-size:13px;color:#1A1A2E;font-weight:600">${formatAmount(m.value)}</span>` : ''}
      </td></tr>
    </table>
  </td></tr>`;
}

/**
 * Core alert processing logic — shared between cron and test endpoints.
 */
export async function processAlerts(options?: { dryRun?: boolean; sinceDaysAgo?: number }): Promise<{
  alertsProcessed: number;
  emailsSent: number;
  usersNotified: number;
  errors: string[];
}> {
  const dryRun = options?.dryRun ?? false;
  const errors: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    console.error('[Cron Alerts] RESEND_API_KEY is not set — cannot send emails');
    return { alertsProcessed: 0, emailsSent: 0, usersNotified: 0, errors: ['RESEND_API_KEY not set'] };
  }

  const now = new Date();
  const defaultSince = new Date(now);
  defaultSince.setDate(defaultSince.getDate() - (options?.sinceDaysAgo ?? 1));
  defaultSince.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const alerts = await prisma.alert.findMany({
    where: {
      active: true,
      frequency: { in: ['DAILY', 'WEEKLY'] },
      user: {
        OR: [
          { role: 'ADMIN' },
          { plan: 'VEILLE', stripeCurrentPeriodEnd: { gt: now } },
        ],
      },
    },
    include: { user: { select: { email: true, name: true, company: true } } },
  });

  console.log(`[Cron Alerts] Found ${alerts.length} active alerts`);

  // Phase 1: match marchés for each alert, group by user email
  type AlertResult = { alert: typeof alerts[0]; marches: any[] };
  const userGroups: Map<string, AlertResult[]> = new Map();

  for (const alert of alerts) {
    // Skip WEEKLY alerts sent less than 7 days ago
    if (alert.frequency === 'WEEKLY' && alert.lastSentAt && alert.lastSentAt > sevenDaysAgo) {
      console.log(`[Cron Alerts] Skipping weekly alert "${alert.name}" (id: ${alert.id}) — last sent ${alert.lastSentAt.toISOString()}`);
      continue;
    }

    const sinceDate = alert.lastSentAt || defaultSince;
    console.log(`[Cron Alerts] Processing alert "${alert.name}" (id: ${alert.id}) — sinceDate: ${sinceDate.toISOString()}`);

    // Build the AND conditions array
    const andConditions: any[] = [
      { status: 'OUVERT' },
      // publicationDate fallback: include marchés with publicationDate >= sinceDate
      // OR marchés with null publicationDate but createdAt >= sinceDate
      {
        OR: [
          { publicationDate: { gte: sinceDate } },
          { publicationDate: null, createdAt: { gte: sinceDate } },
        ],
      },
    ];

    // Keywords filter (OR across title/buyer/cpvLabel)
    if (alert.keywords.length > 0) {
      andConditions.push({
        OR: alert.keywords.flatMap(kw => [
          { title: { contains: kw, mode: 'insensitive' } },
          { buyer: { contains: kw, mode: 'insensitive' } },
          { cpvLabel: { contains: kw, mode: 'insensitive' } },
        ]),
      });
    }

    // Nature filter
    if (alert.natures.length > 0) {
      andConditions.push({ nature: { in: alert.natures } });
    }

    // Department filter
    if (alert.departments.length > 0) {
      andConditions.push({ department: { in: alert.departments } });
    }

    const marches = await prisma.marche.findMany({
      where: { AND: andConditions },
      orderBy: { publicationDate: 'desc' },
      take: 20,
    });

    console.log(`[Cron Alerts] Alert "${alert.name}" — ${marches.length} marchés matched`);

    // Update lastMatchCount only (lastSentAt updated after successful email)
    await prisma.alert.update({
      where: { id: alert.id },
      data: { lastMatchCount: marches.length },
    });

    if (marches.length === 0) continue;

    const email = alert.user.email;
    if (!userGroups.has(email)) userGroups.set(email, []);
    userGroups.get(email)!.push({ alert, marches });
  }

  // Phase 2: send ONE email per user, grouping alert results
  let sent = 0;
  const userEmails = Array.from(userGroups.keys());
  console.log(`[Cron Alerts] ${userEmails.length} user(s) to notify`);

  for (const email of userEmails) {
    const alertResults = userGroups.get(email)!;
    const userName = alertResults[0].alert.user.name || 'Client';

    // Deduplicate marchés across alerts for this user
    const seenIds = new Set<string>();
    let totalNew = 0;

    const alertSections = alertResults.map(({ alert, marches }: { alert: any; marches: any[] }) => {
      // Filter out already-seen marchés
      const uniqueMarches = marches.filter((m: any) => {
        if (seenIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
      });
      totalNew += uniqueMarches.length;
      if (uniqueMarches.length === 0) return '';
      const alertName: string = alert.name;
      return `
        <tr><td style="background:#F8FAFC;padding:12px 20px;border-bottom:1px solid #E2E8F0">
          <span style="font-size:13px;font-weight:700;color:#1A1A2E">${escapeHtml(alertName)}</span>
          <span style="font-size:12px;color:#64748B;margin-left:8px">${uniqueMarches.length} resultat${uniqueMarches.length > 1 ? 's' : ''}</span>
        </td></tr>
        ${uniqueMarches.map((m: any, i: number) => renderMarcheRow(m, i === uniqueMarches.length - 1)).join('')}
      `;
    }).filter(Boolean).join('');

    if (totalNew === 0) continue;

    const isSingle = alertResults.length === 1;
    const subject = isSingle
      ? `${alertResults[0].marches.length} nouveau${alertResults[0].marches.length > 1 ? 'x' : ''} marche${alertResults[0].marches.length > 1 ? 's' : ''} — ${escapeHtml(alertResults[0].alert.name)} — AB DRIDI`
      : `${totalNew} nouveau${totalNew > 1 ? 'x' : ''} marche${totalNew > 1 ? 's' : ''} pour vos ${alertResults.length} alertes — AB DRIDI`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <tr><td style="background:#0F0F23;padding:24px;text-align:center">
    <img src="https://abdridi.com/Logo%20AB%20DRIDI.png" alt="AB DRIDI" width="48" height="48" style="display:block;margin:0 auto 8px">
    <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Alerte marches publics</div>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px 24px 8px">
    <h2 style="font-size:18px;font-weight:700;color:#1A1A2E;margin:0 0 8px">Nouveaux marches detectes</h2>
    <p style="font-size:14px;color:#64748B;margin:0 0 20px;line-height:1.5">
      Bonjour ${escapeHtml(userName)},
      <strong style="color:#3B82F6">${totalNew}</strong> nouveau${totalNew > 1 ? 'x' : ''} marche${totalNew > 1 ? 's' : ''} correspond${totalNew > 1 ? 'ent' : ''} a vos criteres de veille.
    </p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;background:#ffffff">
      ${alertSections}
    </table>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:#3B82F6;padding:12px 28px;text-align:center">
        <a href="https://portal.abdridi.com/marches" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Voir tous les marches sur AB DRIDI</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="font-size:12px;color:#94A3B8;margin:0 0 8px;line-height:1.5">
      Vous recevez cet email car vous avez cree des alertes sur AB DRIDI.<br>
      <a href="https://portal.abdridi.com/alertes" style="color:#3B82F6;text-decoration:none">Gerer mes alertes</a>
    </p>
    <p style="font-size:11px;color:#94A3B8;margin:0">
      AB DRIDI — <a href="https://abdridi.com" style="color:#3B82F6;text-decoration:none">abdridi.com</a> — 07 49 84 56 61
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>
        `,
      });
      sent++;
      console.log(`[Cron Alerts] Email sent to ${email} — ${totalNew} marchés`);

      // Update lastSentAt only after successful email send (and not in dryRun/test mode)
      if (!dryRun) {
        const alertIds = alertResults.map(({ alert }: { alert: any }) => alert.id);
        await prisma.alert.updateMany({
          where: { id: { in: alertIds } },
          data: { lastSentAt: now },
        });
        console.log(`[Cron Alerts] Updated lastSentAt for ${alertIds.length} alert(s)`);
      }
    } catch (err: any) {
      const errMsg = `Failed to send to ${email}: ${err.message || err}`;
      console.error(`[Cron Alerts] ${errMsg}`);
      errors.push(errMsg);
    }
  }

  console.log(`[Cron Alerts] Done — ${alerts.length} alerts processed, ${sent} emails sent to ${userEmails.length} users`);
  return { alertsProcessed: alerts.length, emailsSent: sent, usersNotified: userEmails.length, errors };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secretFromParam = searchParams.get('secret');
  const authHeader = req.headers.get('authorization') || '';
  const secretFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!process.env.CRON_SECRET) {
    console.error('[Cron Alerts] CRON_SECRET env variable is not set');
    await prisma.cronLog.create({ data: { jobName: 'alerts', success: false, message: 'CRON_SECRET not set' } });
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const isAuthorized = secretFromParam === process.env.CRON_SECRET || secretFromHeader === process.env.CRON_SECRET;
  if (!isAuthorized) {
    console.warn(`[Cron Alerts] Unauthorized — param=${!!secretFromParam} header=${!!secretFromHeader}`);
    await prisma.cronLog.create({ data: { jobName: 'alerts', success: false, message: 'Unauthorized: invalid secret' } });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const sinceDays = parseInt(searchParams.get('sinceDays') || '0') || undefined;
  const dryRun = searchParams.get('dryRun') === '1';
  const result = await processAlerts({ sinceDaysAgo: sinceDays, dryRun });
  await prisma.cronLog.create({
    data: {
      jobName: 'alerts',
      success: result.errors.length === 0,
      message: result.errors.length > 0 ? result.errors.join('; ') : `OK — ${result.emailsSent} emails sent`,
      alertsProcessed: result.alertsProcessed,
      emailsSent: result.emailsSent,
    },
  });
  return NextResponse.json({ ok: true, ...result });
}
