import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const titulaire = searchParams.get('titulaire') || '';
  const nature = searchParams.get('nature') || '';
  const department = searchParams.get('department') || '';
  const montantMin = searchParams.get('montantMin') || '';
  const montantMax = searchParams.get('montantMax') || '';
  const periode = searchParams.get('periode') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};

  // Recherche texte dans objet ET titulaireNom
  if (q) {
    where.OR = [
      { objet: { contains: q, mode: 'insensitive' } },
      { titulaireNom: { contains: q, mode: 'insensitive' } },
      { acheteurNom: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Filtre spécifique titulaire
  if (titulaire) {
    where.titulaireNom = { contains: titulaire, mode: 'insensitive' };
  }

  if (nature) where.nature = nature;
  if (department) where.departement = department;

  // Filtres montant
  if (montantMin || montantMax) {
    where.montant = {};
    if (montantMin) where.montant.gte = parseFloat(montantMin);
    if (montantMax) where.montant.lte = parseFloat(montantMax);
  }

  // Filtre période
  if (periode) {
    const now = new Date();
    let since: Date;
    switch (periode) {
      case '6m':
        since = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '1a':
        since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2a':
        since = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
    }
    where.dateNotification = { gte: since };
  }

  const [data, total, totalAll, sumResult, topTitulaireResult] =
    await Promise.all([
      prisma.marcheAttribue.findMany({
        where,
        orderBy: { dateNotification: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marcheAttribue.count({ where }),
      prisma.marcheAttribue.count(),
      prisma.marcheAttribue.aggregate({
        where,
        _sum: { montant: true },
      }),
      prisma.marcheAttribue.groupBy({
        by: ['titulaireNom'],
        _count: true,
        orderBy: { _count: { titulaireNom: 'desc' } },
        take: 1,
      }),
    ]);

  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
    stats: {
      totalAll,
      montantCumule: sumResult._sum.montant || 0,
      topTitulaire: topTitulaireResult[0]
        ? {
            nom: topTitulaireResult[0].titulaireNom,
            count: topTitulaireResult[0]._count,
          }
        : null,
    },
  });
}
