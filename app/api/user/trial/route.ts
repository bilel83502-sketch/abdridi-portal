import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TRIAL_PLAN, trialDaysLeft } from '@/lib/trial';

export const dynamic = 'force-dynamic';

/**
 * Statut d'essai du compte connecté (pour le bandeau « X jours restants »
 * et la page Abonnement).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ status: 'NONE' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { role: true, plan: true, stripeCurrentPeriodEnd: true },
  });
  if (!user || user.role !== 'USER') return NextResponse.json({ status: 'NONE' });

  if (user.plan === TRIAL_PLAN) {
    const daysLeft = trialDaysLeft(user.stripeCurrentPeriodEnd);
    return NextResponse.json({
      status: daysLeft > 0 ? 'ACTIVE' : 'EXPIRED',
      daysLeft,
      endsAt: user.stripeCurrentPeriodEnd,
    });
  }
  return NextResponse.json({ status: 'NONE', plan: user.plan });
}
