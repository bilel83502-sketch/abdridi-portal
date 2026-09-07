import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email requis.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ ok: true }); // Don't reveal if email exists

  await prisma.user.update({
    where: { id: user.id },
    data: { marketingConsent: false, marketingConsentDate: new Date() },
  });

  return NextResponse.json({ ok: true });
}
