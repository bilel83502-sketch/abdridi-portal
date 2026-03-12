import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractSiren } from '@/lib/sirene';

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

  // Enrichissement entreprise si SIRET disponible
  let entreprise = null;
  let autresMarches: any[] = [];

  if (marche.titulaireSiret && marche.titulaireSiret.length >= 9) {
    const siren = extractSiren(marche.titulaireSiret);

    // Fetch entreprise data
    entreprise = await prisma.entreprise.findUnique({
      where: { siren },
    });

    // Fetch other marchés by same SIREN (via SIRET prefix match)
    autresMarches = await prisma.marcheAttribue.findMany({
      where: {
        id: { not: marche.id },
        titulaireSiret: { startsWith: siren },
      },
      orderBy: { dateNotification: 'desc' },
      take: 10,
      select: {
        id: true,
        objet: true,
        acheteurNom: true,
        montant: true,
        dateNotification: true,
        nature: true,
        departementNom: true,
      },
    });
  }

  return NextResponse.json({
    ...marche,
    entreprise,
    autresMarches,
  });
}
