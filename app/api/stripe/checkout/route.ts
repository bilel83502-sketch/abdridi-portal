import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    console.log('[Stripe Checkout] Starting...');
    console.log('[Stripe Checkout] STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[Stripe Checkout] No session/email found');
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    console.log('[Stripe Checkout] User:', session.user.email);

    const body = await req.json();
    const priceId = body.priceId || process.env.STRIPE_PRICE_VEILLE || 'price_1T34V638OYpA4xNLxlkyivkz';
    console.log('[Stripe Checkout] Using priceId:', priceId);

    if (!priceId) {
      console.log('[Stripe Checkout] priceId is empty');
      return NextResponse.json({ error: 'Price ID manquant.' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://portal.abdridi.com/abonnement?success=true',
      cancel_url: 'https://portal.abdridi.com/abonnement?canceled=true',
    });

    console.log('[Stripe Checkout] Session created:', checkoutSession.id);
    console.log('[Stripe Checkout] Redirect URL:', checkoutSession.url);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error('[Stripe Checkout] ERROR:', e.message || e);
    console.error('[Stripe Checkout] Stack:', e.stack);
    return NextResponse.json({
      error: e.message || 'Erreur Stripe.',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined,
    }, { status: 500 });
  }
}
