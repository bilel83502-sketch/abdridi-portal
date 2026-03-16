import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ message: 'Email requis.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Always return success to not reveal if email exists
  if (!user || user.emailVerified) {
    return NextResponse.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  }

  // Delete old tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

  try {
    await resend.emails.send({
      from: 'AB DRIDI <noreply@abdridi.com>',
      to: user.email,
      subject: 'Vérifiez votre adresse email — AB DRIDI',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
          <div style="padding:24px;background:#0F1724;text-align:center">
            <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
          </div>
          <div style="padding:32px 24px">
            <h2 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 16px">Bienvenue sur AB DRIDI</h2>
            <p style="font-size:14px;color:#64748B;line-height:1.6;margin:0 0 24px">
              Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :
            </p>
            <div style="text-align:center;margin:0 0 24px">
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#3B82F6;color:#fff;text-decoration:none;font-weight:600;font-size:14px">
                Vérifier mon email
              </a>
            </div>
            <p style="font-size:13px;color:#94A3B8;margin:0">Ce lien expire dans 24 heures.</p>
            <p style="font-size:13px;color:#94A3B8;margin:8px 0 0">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Resend verification] Error:', err);
  }

  return NextResponse.json({ message: 'Si ce compte existe, un email a été envoyé.' });
}
