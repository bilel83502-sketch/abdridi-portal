import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find free users registered > 3 days ago, not nurtured in the last month
  const users = await prisma.user.findMany({
    where: {
      plan: 'DECOUVERTE',
      role: 'USER',
      marketingConsent: true,
      createdAt: { lte: threeDaysAgo },
      OR: [
        { lastNurturingEmail: null },
        { lastNurturingEmail: { lte: oneMonthAgo } },
      ],
    },
    take: 20, // batch
  });

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users' });
  }

  // Get recent consultations for the email
  const recentMarches = await prisma.marche.findMany({
    where: { status: 'OUVERT', publicationDate: { gte: weekAgo, not: null } },
    orderBy: { publicationDate: 'desc' },
    take: 3,
    select: { title: true, buyer: true, department: true, nature: true, deadline: true },
  });

  const weekCount = await prisma.marche.count({
    where: { publicationDate: { gte: weekAgo }, status: 'OUVERT' },
  });

  let sent = 0;
  for (const user of users) {
    try {
      const marchesHtml = recentMarches.map(m =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${m.title?.slice(0, 80)}...</td><td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;">${m.buyer?.slice(0, 30)}</td></tr>`
      ).join('');

      await resend.emails.send({
        from: 'AB DRIDI <noreply@abdridi.com>',
        to: user.email,
        subject: `${weekCount} nouvelles consultations cette semaine — AB DRIDI`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;color:#1F2937;max-width:600px;margin:0 auto;padding:20px;">
          <div style="text-align:center;margin-bottom:24px;">
            <strong style="font-size:20px;color:#0A1628;">AB DRIDI</strong>
            <p style="font-size:13px;color:#6B7280;margin:4px 0 0;">Marchés Publics</p>
          </div>
          <p>Bonjour ${user.name},</p>
          <p>Cette semaine, <strong style="color:#3B82F6;">${weekCount} nouvelles consultations</strong> ont été publiées sur notre plateforme. Voici un aperçu :</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#F9FAFB;"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#9CA3AF;">Consultation</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#9CA3AF;">Acheteur</th></tr></thead>
            <tbody>${marchesHtml}</tbody>
          </table>
          <p style="font-size:13px;color:#6B7280;">Avec l'offre <strong>Veille & Accompagnement</strong>, accédez à toutes les consultations, recevez des alertes personnalisées et exportez vos données.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://portal.abdridi.com/abonnement" style="display:inline-block;padding:12px 32px;background:#3B82F6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:6px;">Passer à l'offre Veille — 150€/mois</a>
          </div>
          <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:32px;">Vous recevez cet email car vous avez accepté nos communications marketing sur portal.abdridi.com.<br><a href="https://portal.abdridi.com/unsubscribe?email=${encodeURIComponent(user.email)}" style="color:#3B82F6;text-decoration:underline;">Se désinscrire</a></p>
        </body></html>`,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastNurturingEmail: now },
      });
      sent++;
    } catch (e) {
      console.error(`[NURTURING] Failed for ${user.email}:`, e);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
