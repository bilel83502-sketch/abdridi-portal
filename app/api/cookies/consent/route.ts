import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { accepted } = await req.json();

  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as any)?.id || null;
  } catch { /* anonymous consent */ }

  await prisma.cookieConsent.create({
    data: {
      userId,
      accepted: !!accepted,
      userAgent: req.headers.get('user-agent') || null,
    },
  });

  return NextResponse.json({ ok: true });
}
