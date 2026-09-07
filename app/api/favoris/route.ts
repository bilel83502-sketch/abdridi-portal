import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET — list user's favoris (marcheIds)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const userId = (session.user as any).id;

  const favoris = await prisma.favori.findMany({
    where: { userId },
    select: { marcheId: true },
  });

  return NextResponse.json({ ids: favoris.map(f => f.marcheId) });
}

// POST — toggle favori
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const userId = (session.user as any).id;

  const { marcheId } = await req.json();
  if (!marcheId) return NextResponse.json({ error: 'marcheId requis' }, { status: 400 });

  const existing = await prisma.favori.findUnique({
    where: { userId_marcheId: { userId, marcheId } },
  });

  if (existing) {
    await prisma.favori.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favori.create({ data: { userId, marcheId } });
  return NextResponse.json({ favorited: true });
}
