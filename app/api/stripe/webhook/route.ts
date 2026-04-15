import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  let event: Stripe.Event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET non configuré');
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  // Idempotency check — skip already-processed events
  const existing = await prisma.stripeEventLog.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = session.metadata?.userId;

          if (userId) {
            const priceId = subscription.items.data[0]?.price.id;

            await tx.user.update({
              where: { id: userId },
              data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: 'VEILLE',
              },
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await tx.user.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            const priceId = subscription.items.data[0]?.price.id;

            await tx.user.update({
              where: { id: user.id },
              data: {
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: 'VEILLE',
              },
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await tx.user.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            await tx.user.update({
              where: { id: user.id },
              data: {
                stripeSubscriptionId: null,
                stripePriceId: null,
                stripeCurrentPeriodEnd: null,
                plan: 'DECOUVERTE',
              },
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const user = await tx.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user) {
            // Send alert email to admin
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'AB DRIDI <noreply@abdridi.com>',
              to: 'contact@abdridi.com',
              subject: `[ALERTE] Paiement échoué — ${user.email}`,
              html: `<p>Le paiement a échoué pour l'utilisateur <strong>${user.name}</strong> (${user.email}).</p><p>Customer ID: ${customerId}</p><p>Invoice ID: ${invoice.id}</p>`,
            }).catch(() => {});
            // Log audit
            await tx.auditLog.create({
              data: { userId: user.id, userEmail: user.email, action: 'PAYMENT_FAILED', resource: 'stripe', resourceId: invoice.id, success: false },
            });
          }
          break;
        }

        case 'charge.dispute.created': {
          const dispute = event.data.object as Stripe.Dispute;
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'AB DRIDI <noreply@abdridi.com>',
            to: 'contact@abdridi.com',
            subject: `[URGENT] Litige Stripe ouvert — ${dispute.amount / 100}€`,
            html: `<p>Un litige a été ouvert sur Stripe.</p><p>Montant: ${dispute.amount / 100}€</p><p>Raison: ${dispute.reason}</p><p>Dispute ID: ${dispute.id}</p><p><a href="https://dashboard.stripe.com/disputes/${dispute.id}">Voir sur Stripe</a></p>`,
          }).catch(() => {});
          await tx.auditLog.create({
            data: { action: 'DISPUTE_CREATED', resource: 'stripe', resourceId: dispute.id, success: true, metadata: { amount: dispute.amount, reason: dispute.reason } },
          });
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'AB DRIDI <noreply@abdridi.com>',
            to: 'contact@abdridi.com',
            subject: `[INFO] Remboursement Stripe — ${(charge.amount_refunded || 0) / 100}€`,
            html: `<p>Un remboursement a été effectué.</p><p>Montant remboursé: ${(charge.amount_refunded || 0) / 100}€</p><p>Charge ID: ${charge.id}</p>`,
          }).catch(() => {});
          await tx.auditLog.create({
            data: { action: 'REFUND_PROCESSED', resource: 'stripe', resourceId: charge.id, success: true, metadata: { amount_refunded: charge.amount_refunded } },
          });
          break;
        }
      }

      // Log processed event inside the transaction
      await tx.stripeEventLog.create({
        data: { stripeEventId: event.id, eventType: event.type, success: true },
      });
    });

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook processing error:', e);

    // Log failed event for idempotency tracking
    await prisma.stripeEventLog.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        success: false,
        errorMessage: e.message?.slice(0, 500) || 'Unknown error',
      },
    }).catch(() => {}); // Don't fail if logging itself fails

    return NextResponse.json({ error: 'Erreur de traitement.' }, { status: 500 });
  }
}
