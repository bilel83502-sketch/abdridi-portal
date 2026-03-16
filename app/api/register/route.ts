import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  email: z.string().email('Email invalide.'),
  company: z.string().optional(),
  phone: z.string().optional(),
  siret: z.string().optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

export async function POST(req: Request) {
  try {
    // Rate limiting by IP (5 registrations per hour)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const { allowed } = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans une heure.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (exists) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        company: data.company?.trim() || null,
        phone: data.phone?.trim() || null,
        siret: data.siret?.trim() || null,
        passwordHash: hash,
        role: 'USER',
        plan: 'DECOUVERTE',
      },
    });

    // Send verification email
    try {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await prisma.verificationToken.create({
        data: { identifier: user.email, token, expires },
      });

      const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
      const resend = new Resend(process.env.RESEND_API_KEY);

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
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[Register] Verification email failed:', emailErr);
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      const firstError = e.errors[0]?.message || 'Données invalides.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
