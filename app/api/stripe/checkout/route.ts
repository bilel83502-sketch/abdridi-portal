import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[Stripe Checkout] No session/email found');
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const { priceId } = await req.json();
    console.log('[Stripe Checkout] Received priceId:', priceId);

    if (!priceId) {
      console.log('[Stripe Checkout] priceId is empty');
      return NextResponse.json({ error: 'Price ID manquant.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('[Stripe Checkout] User not found:', session.user.email);
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      console.log('[Stripe Checkout] Creating Stripe customer for:', user.email);
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
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://portal.abdridi.com';

    // Create checkout session
    console.log('[Stripe Checkout] Creating checkout session with:', {
      customer: customerId,
      priceId,
      mode: 'subscription',
      successUrl: `${baseUrl}/abonnement?success=true`,
      cancelUrl: `${baseUrl}/abonnement?canceled=true`,
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/abonnement?success=true`,
      cancel_url: `${baseUrl}/abonnement?canceled=true`,
      metadata: { userId: user.id },
    });

    console.log('[Stripe Checkout] Session created:', checkoutSession.id, 'URL:', checkoutSession.url);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error('[Stripe Checkout] Error:', e.message || e);
    return NextResponse.json({ error: e.message || 'Erreur Stripe.' }, { status: 500 });
  }
}
