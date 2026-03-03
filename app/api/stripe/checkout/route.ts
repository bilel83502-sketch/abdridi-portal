import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const body = await req.json();
    const priceId = body.priceId || process.env.STRIPE_PRICE_VEILLE;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID manquant. Vérifiez la variable STRIPE_PRICE_VEILLE.' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userEmail: session.user.email,
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
