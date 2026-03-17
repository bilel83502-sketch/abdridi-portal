import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AB DRIDI <onboarding@resend.dev>';

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(v: number | null | undefined): string {
  if (!v) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const alerts = await prisma.alert.findMany({
    where: { active: true },
    include: { user: { select: { email: true, name: true, company: true } } },
  });

  let sent = 0;

  for (const alert of alerts) {
    const where: any = {
      status: 'OUVERT',
      publicationDate: { gte: yesterday },
    };

    if (alert.keywords.length > 0) {
      where.OR = alert.keywords.map(kw => ({
        OR: [
          { title: { contains: kw, mode: 'insensitive' } },
          { buyer: { contains: kw, mode: 'insensitive' } },
          { cpvLabel: { contains: kw, mode: 'insensitive' } },
        ],
      }));
    }

    if (alert.natures.length > 0) {
      where.nature = { in: alert.natures };
    }

    if (alert.departments.length > 0) {
      where.department = { in: alert.departments };
    }

    const marches = await prisma.marche.findMany({
      where,
      orderBy: { publicationDate: 'desc' },
      take: 20,
    });

    if (marches.length === 0) continue;

    const marchesRows = marches.map((m, i) => `
      <tr><td style="padding:16px 20px;${i < marches.length - 1 ? 'border-bottom:1px solid #E2E8F0;' : ''}">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td>
            <a href="https://portal.abdridi.com/marches/${m.id}" style="font-size:14px;font-weight:600;color:#1A1A2E;text-decoration:none;line-height:1.4">${m.title}</a>
          </td></tr>
          <tr><td style="padding-top:6px">
            <table cellpadding="0" cellspacing="0" style="width:100%">
              <tr>
                <td style="font-size:12px;color:#64748B;padding:2px 0">
                  <strong style="color:#1A1A2E">Émetteur :</strong> ${m.buyer}
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#64748B;padding:2px 0">
                  <strong style="color:#1A1A2E">Date limite :</strong> ${formatDate(m.deadline)}
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <strong style="color:#1A1A2E">Source :</strong> <span style="color:#3B82F6;font-weight:500">${m.source}</span>
                </td>
              </tr>
              ${m.value ? `<tr><td style="font-size:13px;color:#1A1A2E;font-weight:600;padding:4px 0 0">${formatAmount(m.value)}</td></tr>` : ''}
            </table>
          </td></tr>
        </table>
      </td></tr>
    `).join('');

    const count = marches.length;
    const subject = `${count} nouveau${count > 1 ? 'x' : ''} marché${count > 1 ? 's' : ''} correspond${count > 1 ? 'ent' : ''} à votre alerte — AB DRIDI`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: alert.user.email,
        subject,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <!-- Header -->
  <tr><td style="background:#0F0F23;padding:24px;text-align:center">
    <img src="https://abdridi.com/Logo%20AB%20DRIDI.png" alt="AB DRIDI" width="48" height="48" style="display:block;margin:0 auto 8px">
    <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Alerte marchés publics</div>
  </td></tr>
  <!-- Body -->
  <tr><td style="background:#ffffff;padding:28px 24px 8px">
    <h2 style="font-size:18px;font-weight:700;color:#1A1A2E;margin:0 0 8px">Nouveaux marchés détectés</h2>
    <p style="font-size:14px;color:#64748B;margin:0 0 20px;line-height:1.5">
      Bonjour ${alert.user.name || 'Client'},
      <strong style="color:#3B82F6">${count}</strong> nouveau${count > 1 ? 'x' : ''} marché${count > 1 ? 's' : ''} correspond${count > 1 ? 'ent' : ''} à votre alerte <strong style="color:#1A1A2E">"${alert.name}"</strong>.
    </p>
  </td></tr>
  <!-- Marchés list -->
  <tr><td style="background:#ffffff;padding:0 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;background:#ffffff">
      ${marchesRows}
    </table>
  </td></tr>
  <!-- CTA -->
  <tr><td style="background:#ffffff;padding:24px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:#3B82F6;padding:12px 28px;text-align:center">
        <a href="https://portal.abdridi.com/marches" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Voir tous les marchés sur AB DRIDI</a>
      </td></tr>
    </table>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 24px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="font-size:12px;color:#94A3B8;margin:0 0 8px;line-height:1.5">
      Vous recevez cet email car vous avez créé une alerte sur AB DRIDI.<br>
      Pour modifier vos alertes, <a href="https://portal.abdridi.com/alertes" style="color:#3B82F6;text-decoration:none">connectez-vous à votre espace client</a>.
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
    } catch (err) {
      console.error(`Failed to send alert email for alert ${alert.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, alertsProcessed: alerts.length, emailsSent: sent });
}
