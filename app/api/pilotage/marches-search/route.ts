import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const marches = await prisma.marche.findMany({
    where: {
      status: 'OUVERT',
      title: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, title: true, buyer: true, nature: true, department: true, deadline: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(marches);
}
