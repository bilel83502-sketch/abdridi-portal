import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé.' }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/abonnement`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (e: any) {
    console.error('Stripe portal error:', e);
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 });
  }
}
