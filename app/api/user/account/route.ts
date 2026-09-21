import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing_key', { typescript: true });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await req.json();
  const { password } = body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // Verify password (skip for Google-only accounts)
  if (user.passwordHash) {
    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis pour confirmer la suppression.' }, { status: 400 });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 403 });
    }
  }

  // Cancel active Stripe subscription if present
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (e) {
      console.error('[Account Delete] Stripe cancel failed:', e);
    }
  }

  // Anonymize audit logs (legal: keep logs but remove personal data)
  const hashedEmail = crypto.createHash('sha256').update(email).digest('hex').slice(0, 12);
  await prisma.auditLog.updateMany({
    where: { userId: user.id },
    data: { userId: `deleted_${hashedEmail}`, userEmail: `deleted_${hashedEmail}@anonymous` },
  });

  // Log the deletion before deleting the user
  await prisma.auditLog.create({
    data: {
      userId: `deleted_${hashedEmail}`,
      userEmail: `deleted_${hashedEmail}@anonymous`,
      action: 'ACCOUNT_DELETED',
      resource: 'User',
      resourceId: user.id,
      success: true,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    },
  });

  // Delete user — cascades: alerts, favoris, appointments, relances, cookie consents
  // Missions/prospects cascade through mission ownership if needed
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true, message: 'Compte supprimé avec succès.' });
}
