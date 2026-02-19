import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const marche = await prisma.marcheAttribue.findUnique({
    where: { id: params.id },
  });

  if (!marche) {
    return NextResponse.json(
      { error: 'Marché attribué introuvable' },
      { status: 404 }
    );
  }

  return NextResponse.json(marche);
}
