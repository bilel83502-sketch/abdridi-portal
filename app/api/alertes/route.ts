import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = 'AB DRIDI <noreply@abdridi.com>';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

import { hasFullAccess } from '@/lib/access';

function isPaidUser(user: { role: string; plan: string; stripeCurrentPeriodEnd: Date | null }): boolean {
  return hasFullAccess(user);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const userId = (session.user as any).id;
  const [alerts, user] = await Promise.all([
    prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, plan: true, stripeCurrentPeriodEnd: true } }),
  ]);
  const isPaid = user ? isPaidUser(user) : false;
  return NextResponse.json({ alerts, isPaid });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const user = session.user as any;

  // Check plan — free users cannot create alerts
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, plan: true, stripeCurrentPeriodEnd: true } });
  if (!dbUser || !isPaidUser(dbUser)) {
    return NextResponse.json({ error: 'Les alertes sont réservées aux abonnés Veille & Accompagnement' }, { status: 403 });
  }

  const body = await req.json();

  // Validation
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  if (!name) return NextResponse.json({ error: 'Le nom de l\'alerte est obligatoire (max 100 caractères)' }, { status: 400 });
  const keywords = Array.isArray(body.keywords) ? body.keywords.filter((k: any) => typeof k === 'string' && k.trim()) : [];
  if (keywords.length === 0) return NextResponse.json({ error: 'Au moins un mot-clé est obligatoire' }, { status: 400 });
  const frequency = ['DAILY', 'WEEKLY', 'IMMEDIATE'].includes(body.frequency) ? body.frequency : 'DAILY';
  const natures = Array.isArray(body.natures) ? body.natures.filter((n: any) => typeof n === 'string') : [];
  const departments = Array.isArray(body.departments) ? body.departments.filter((d: any) => typeof d === 'string') : [];

  // Limit: max 10 alerts per user
  const alertCount = await prisma.alert.count({ where: { userId: user.id } });
  if (alertCount >= 10) return NextResponse.json({ error: 'Limite de 10 alertes atteinte. Supprimez une alerte existante.' }, { status: 400 });

  const alert = await prisma.alert.create({
    data: { userId: user.id, name, keywords, natures, departments, frequency },
  });

  // Send confirmation email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const keywordsHtml = alert.keywords.length > 0
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top">Mots-clés</td><td style="padding:6px 0;font-size:13px;color:#1A1A2E;font-weight:500">${alert.keywords.map(escapeHtml).join(', ')}</td></tr>`
      : '';
    const naturesHtml = alert.natures.length > 0
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top">Secteurs</td><td style="padding:6px 0;font-size:13px;color:#1A1A2E;font-weight:500">${alert.natures.map(escapeHtml).join(', ')}</td></tr>`
      : '';
    const deptsHtml = alert.departments.length > 0
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top">Départements</td><td style="padding:6px 0;font-size:13px;color:#1A1A2E;font-weight:500">${alert.departments.map(escapeHtml).join(', ')}</td></tr>`
      : '';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Votre alerte a bien été créée — AB DRIDI',
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
  </td></tr>
  <!-- Body -->
  <tr><td style="background:#ffffff;padding:32px 24px">
    <h2 style="font-size:18px;font-weight:700;color:#1A1A2E;margin:0 0 16px">Alerte créée avec succès</h2>
    <p style="font-size:14px;color:#1A1A2E;line-height:1.6;margin:0 0 20px">
      Bonjour ${escapeHtml(user.name || user.email)},<br>
      Votre alerte <strong style="color:#3B82F6">"${escapeHtml(alert.name)}"</strong> a bien été enregistrée.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;padding:16px;margin-bottom:20px">
      <tr><td>
        <table cellpadding="0" cellspacing="0" style="width:100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top">Nom</td><td style="padding:6px 0;font-size:13px;color:#1A1A2E;font-weight:500">${escapeHtml(alert.name)}</td></tr>
          ${keywordsHtml}
          ${naturesHtml}
          ${deptsHtml}
          <tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top">Fréquence</td><td style="padding:6px 0;font-size:13px;color:#1A1A2E;font-weight:500">${alert.frequency === 'DAILY' ? 'Quotidienne' : alert.frequency === 'WEEKLY' ? 'Hebdomadaire' : alert.frequency}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#64748B;line-height:1.6;margin:0 0 24px">
      Vous recevrez un email dès qu'un nouvel appel d'offres correspondant sera publié.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:#3B82F6;padding:12px 28px;text-align:center">
        <a href="https://portal.abdridi.com/alertes" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Gérer mes alertes</a>
      </td></tr>
    </table>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 24px;text-align:center;font-size:12px;color:#94A3B8">
    AB DRIDI — <a href="https://abdridi.com" style="color:#3B82F6;text-decoration:none">abdridi.com</a>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>
      `,
    });
  } catch (err) {
    console.error('[Alertes] Confirmation email failed:', err);
  }

  logAudit({ userId: user.id, userEmail: user.email, action: 'ALERT_CREATE', resource: 'Alert', resourceId: alert.id, request: req });

  return NextResponse.json(alert, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const { id } = body;

  // Whitelist allowed fields
  const allowedUpdates: any = {};
  if (typeof body.active === 'boolean') allowedUpdates.active = body.active;
  if (typeof body.name === 'string' && body.name.trim()) allowedUpdates.name = body.name.trim();
  if (Array.isArray(body.keywords)) allowedUpdates.keywords = body.keywords;
  if (Array.isArray(body.natures)) allowedUpdates.natures = body.natures;
  if (Array.isArray(body.departments)) allowedUpdates.departments = body.departments;
  if (['DAILY', 'WEEKLY', 'IMMEDIATE'].includes(body.frequency)) allowedUpdates.frequency = body.frequency;

  if (Object.keys(allowedUpdates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
  }

  // Block reactivation for free users
  if (allowedUpdates.active === true) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, plan: true, stripeCurrentPeriodEnd: true } });
    if (!dbUser || !isPaidUser(dbUser)) {
      return NextResponse.json({ error: 'Réactivation réservée aux abonnés Veille & Accompagnement' }, { status: 403 });
    }
  }

  const alert = await prisma.alert.updateMany({ where: { id, userId }, data: allowedUpdates });
  return NextResponse.json(alert);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json();
  const user = session.user as any;
  await prisma.alert.deleteMany({ where: { id, userId: user.id } });
  logAudit({ userId: user.id, userEmail: user.email, action: 'ALERT_DELETE', resource: 'Alert', resourceId: id, request: req });
  return NextResponse.json({ ok: true });
}
