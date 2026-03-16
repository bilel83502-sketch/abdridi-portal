import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json({ error: 'Lien invalide ou déjà utilisé.' }, { status: 400 });
  }

  if (new Date() > record.expires) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.json({ error: 'Lien expiré. Demandez un nouveau lien.' }, { status: 400 });
  }

  // Mark email as verified
  await prisma.user.updateMany({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  // Delete the token
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ ok: true, message: 'Email vérifié avec succès.' });
}
