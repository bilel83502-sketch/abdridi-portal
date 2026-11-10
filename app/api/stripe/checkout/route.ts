import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { isTrialActive } from '@/lib/trial';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing_key', {
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const body = await req.json();
    const priceId = body.priceId || process.env.STRIPE_PRICE_VEILLE;
    if (!priceId) {
      throw new Error('STRIPE_PRICE_VEILLE is not defined and no priceId provided');
    }

    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Client en essai gratuit : il garde ses jours offerts, le premier
    // prélèvement a lieu à la fin de l'essai (Stripe exige ≥ 48 h).
    let trialEnd: number | undefined;
    if (isTrialActive(dbUser) && dbUser.stripeCurrentPeriodEnd) {
      const endMs = new Date(dbUser.stripeCurrentPeriodEnd).getTime();
      if (endMs - Date.now() > 49 * 60 * 60 * 1000) trialEnd = Math.floor(endMs / 1000);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(trialEnd ? { subscription_data: { trial_end: trialEnd } } : {}),
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: dbUser.id,
      },
      success_url: `${process.env.NEXTAUTH_URL || 'https://portal.abdridi.com'}/abonnement?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://portal.abdridi.com'}/abonnement?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error('[Stripe Checkout] ERROR:', e.message || e);
    return NextResponse.json({
      error: e.message || 'Erreur lors de la création de la session Stripe.',
    }, { status: 500 });
  }
}
