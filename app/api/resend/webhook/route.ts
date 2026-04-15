import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();

  // Verify webhook signature
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  // Verify signature using RESEND_WEBHOOK_SECRET
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Resend uses Svix for webhooks - verify with crypto
  const crypto = await import('crypto');
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const secret = webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret;
  const secretBytes = Buffer.from(secret, 'base64');
  const expectedSignature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const signatures = svixSignature.split(' ').map(s => s.split(',')[1]);
  const isValid = signatures.some(sig => sig === expectedSignature);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'email.bounced': {
        const email = event.data?.to?.[0] || event.data?.email;
        if (email) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (user) {
            await prisma.auditLog.create({
              data: { userId: user.id, userEmail: email, action: 'EMAIL_BOUNCED', resource: 'resend', success: false },
            });
          }
        }
        console.log('[Resend] Email bounced:', email);
        break;
      }

      case 'email.complained': {
        const email = event.data?.to?.[0] || event.data?.email;
        if (email) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { marketingConsent: false },
            });
            await prisma.auditLog.create({
              data: { userId: user.id, userEmail: email, action: 'EMAIL_COMPLAINT', resource: 'resend', success: false },
            });
          }
        }
        console.log('[Resend] Email complaint:', email);
        break;
      }

      case 'email.delivered': {
        console.log('[Resend] Email delivered:', event.data?.to?.[0]);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Resend Webhook] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
