import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    const [totalUsers, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
          plan: true,
          createdAt: true,
          lastLoginAt: true,
          stripeSubscriptionId: true,
          stripeCurrentPeriodEnd: true,
          stripePriceId: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date();
    const paidUsers = users.filter(
      (u) => u.stripeCurrentPeriodEnd && new Date(u.stripeCurrentPeriodEnd) > now
    );

    // Calculate monthly revenue
    let monthlyRevenue = 0;
    for (const u of paidUsers) {
      if (u.stripePriceId === process.env.STRIPE_PRICE_MONTAGE) {
        monthlyRevenue += 199;
      } else {
        monthlyRevenue += 49;
      }
    }

    return NextResponse.json({
      totalUsers,
      paidUsers: paidUsers.length,
      monthlyRevenue,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        company: u.company,
        role: u.role,
        plan: u.plan,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        hasSub: !!(u.stripeCurrentPeriodEnd && new Date(u.stripeCurrentPeriodEnd) > now),
      })),
    });
  } catch (e: any) {
    console.error('Admin API error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
