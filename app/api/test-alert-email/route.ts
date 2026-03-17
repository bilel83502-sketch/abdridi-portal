import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AB DRIDI <onboarding@resend.dev>';

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = 'bilel83502@gmail.com';
  const alertName = 'Transport Île-de-France';
  const userName = 'Bilel';

  const fakeMarches = [
    {
      id: 'test-1',
      title: 'Transport scolaire — Communauté de communes Val-de-Marne',
      buyer: 'CC Val-de-Marne',
      deadline: new Date('2026-04-15'),
      value: 450000,
      source: 'BOAMP',
      nature: 'Services',
      department: '94',
    },
    {
      id: 'test-2',
      title: 'Marché de transport de personnes à mobilité réduite',
      buyer: 'Département de Seine-et-Marne',
      deadline: new Date('2026-04-22'),
      value: 1200000,
      source: 'PLACE',
      nature: 'Services',
      department: '77',
    },
    {
      id: 'test-3',
      title: 'Acquisition de véhicules de transport collectif',
      buyer: 'RATP',
      deadline: new Date('2026-05-01'),
      value: null as number | null,
      source: 'TED',
      nature: 'Fournitures',
      department: '75',
    },
  ];

  const marchesRows = fakeMarches.map((m, i) => `
    <tr><td style="padding:16px 20px;${i < fakeMarches.length - 1 ? 'border-bottom:1px solid #E2E8F0;' : ''}">
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

  const count = fakeMarches.length;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${count} nouveaux marchés correspondent à votre alerte — AB DRIDI`,
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
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Alerte marchés publics</div>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px 24px 8px">
    <h2 style="font-size:18px;font-weight:700;color:#1A1A2E;margin:0 0 8px">Nouveaux marchés détectés</h2>
    <p style="font-size:14px;color:#64748B;margin:0 0 20px;line-height:1.5">
      Bonjour ${userName},
      <strong style="color:#3B82F6">${count}</strong> nouveaux marchés correspondent à votre alerte <strong style="color:#1A1A2E">"${alertName}"</strong>.
    </p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;background:#ffffff">
      ${marchesRows}
    </table>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:#3B82F6;padding:12px 28px;text-align:center">
        <a href="https://portal.abdridi.com/marches" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Voir tous les marchés sur AB DRIDI</a>
      </td></tr>
    </table>
  </td></tr>
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

    return NextResponse.json({ ok: true, emailId: result.data?.id, to });
  } catch (err: any) {
    console.error('[Test Alert Email] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
