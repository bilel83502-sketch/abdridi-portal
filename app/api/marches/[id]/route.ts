import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const marche = await prisma.marche.findUnique({
    where: { id: params.id },
  });

  if (!marche) {
    return NextResponse.json({ error: 'Marché introuvable' }, { status: 404 });
  }

  return NextResponse.json(marche);
}
