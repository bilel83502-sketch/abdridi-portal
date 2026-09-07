import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimitCheck } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
const PASSWORD_ERROR = 'Le mot de passe doit contenir au moins 10 caractères, une majuscule, un chiffre et un caractère spécial (!@#$%^&*).';

export async function POST(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const { allowed } = await rateLimitCheck(`reset-pwd:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900' } },
    );
  }

  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  if (password.length < 10) {
    return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json({ error: 'Lien invalide ou déjà utilisé.' }, { status: 400 });
  }

  if (new Date() > record.expires) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.json({ error: 'Lien expiré. Demandez un nouveau lien.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.updateMany({
    where: { email: record.identifier },
    data: { passwordHash: hash },
  });

  await prisma.verificationToken.delete({ where: { token } });

  logAudit({ userEmail: record.identifier, action: 'PASSWORD_RESET', resource: 'User', request: req });

  return NextResponse.json({ ok: true, message: 'Mot de passe mis à jour.' });
}
