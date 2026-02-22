import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log('[Stripe Checkout] Starting...');
    console.log('[Stripe Checkout] STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[Stripe Checkout] No session/email found');
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }
    console.log('[Stripe Checkout] User:', session.user.email);

    const body = await req.json();
    const priceId = body.priceId;
    console.log('[Stripe Checkout] Received priceId:', priceId);

    if (!priceId) {
      console.log('[Stripe Checkout] priceId is empty');
      return NextResponse.json({ error: 'Price ID manquant.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('[Stripe Checkout] User not found in DB:', session.user.email);
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      console.log('[Stripe Checkout] Creating new Stripe customer for:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
      console.log('[Stripe Checkout] Customer created:', customerId);
    }

    // Create checkout session
    const checkoutParams: any = {
      customer: customerId,
      customer_email: undefined, // Already set via customer
      mode: 'subscription' as const,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://portal.abdridi.com/abonnement?success=true',
      cancel_url: 'https://portal.abdridi.com/abonnement?canceled=true',
      metadata: { userId: user.id },
    };

    console.log('[Stripe Checkout] Creating session with params:', JSON.stringify({
      customer: customerId,
      mode: 'subscription',
      priceId,
      success_url: checkoutParams.success_url,
      cancel_url: checkoutParams.cancel_url,
    }));

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    console.log('[Stripe Checkout] Session created successfully:', checkoutSession.id);
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
