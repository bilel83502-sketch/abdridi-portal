import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Get all active alerts with their users
  const alerts = await prisma.alert.findMany({
    where: { active: true },
    include: { user: { select: { email: true, name: true, company: true } } },
  });

  let sent = 0;

  for (const alert of alerts) {
    // Build query matching alert criteria
    const where: any = {
      status: 'OUVERT',
      publicationDate: { gte: yesterday },
    };

    // Match ANY keyword (OR)
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

    // Build email HTML
    const marchesHtml = marches.map(m => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0">
          <div style="font-size:14px;font-weight:600;color:#0F172A;margin-bottom:4px">${m.title}</div>
          <div style="font-size:12px;color:#64748B">${m.buyer} — ${m.departmentName || m.department} · ${m.nature}</div>
          ${m.value ? `<div style="font-size:13px;font-weight:600;color:#0F172A;margin-top:4px">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m.value)}</div>` : ''}
          <a href="https://portal.abdridi.com/marches/${m.id}" style="font-size:12px;color:#3B82F6;text-decoration:none;font-weight:500">Voir le détail →</a>
        </td>
      </tr>
    `).join('');

    try {
      await resend.emails.send({
        from: 'AB DRIDI <alertes@abdridi.com>',
        to: alert.user.email,
        subject: `${marches.length} nouvelle${marches.length > 1 ? 's' : ''} consultation${marches.length > 1 ? 's' : ''} — ${alert.name}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
            <div style="padding:24px 24px 16px;background:#0F1724;text-align:center">
              <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Alerte marchés publics</div>
            </div>
            <div style="padding:24px">
              <p style="font-size:14px;color:#374151;margin:0 0 4px">Bonjour ${alert.user.name || 'Client'},</p>
              <p style="font-size:14px;color:#64748B;margin:0 0 20px">
                <strong style="color:#3B82F6">${marches.length}</strong> nouvelle${marches.length > 1 ? 's' : ''} consultation${marches.length > 1 ? 's' : ''} correspond${marches.length > 1 ? 'ent' : ''} à votre alerte <strong>"${alert.name}"</strong>.
              </p>
              <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0">
                ${marchesHtml}
              </table>
              <div style="text-align:center;margin-top:24px">
                <a href="https://portal.abdridi.com/marches" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;font-weight:600;font-size:13px">
                  Voir toutes les consultations
                </a>
              </div>
            </div>
            <div style="padding:16px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8">
              AB DRIDI — Veille marchés publics · <a href="https://portal.abdridi.com/alertes" style="color:#3B82F6;text-decoration:none">Gérer mes alertes</a>
            </div>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send alert email for alert ${alert.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, alertsProcessed: alerts.length, emailsSent: sent });
}
