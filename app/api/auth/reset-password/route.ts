import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
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

  return NextResponse.json({ ok: true, message: 'Mot de passe mis à jour.' });
}
