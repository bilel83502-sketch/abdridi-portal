import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json([]);

  // Search by name or siren
  const results = await prisma.entreprise.findMany({
    where: {
      OR: [
        { raisonSociale: { contains: q, mode: 'insensitive' } },
        { siren: { startsWith: q } },
      ],
    },
    take: 10,
    orderBy: { raisonSociale: 'asc' },
  });

  return NextResponse.json(results);
}
