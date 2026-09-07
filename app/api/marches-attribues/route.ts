import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractSiren } from '@/lib/sirene';
import { getUserAccess } from '@/lib/access';
import { TRANSPORT_CPV_PREFIXES, TRANSPORT_KEYWORDS } from '@/lib/sectors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { isPaid } = await getUserAccess();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const titulaire = searchParams.get('titulaire') || '';
  const nature = searchParams.get('nature') || '';
  const department = searchParams.get('department') || '';
  const montantMin = searchParams.get('montantMin') || '';
  const montantMax = searchParams.get('montantMax') || '';
  const periode = searchParams.get('periode') || '';
  const sector = (searchParams.get('sector') || '').toLowerCase();
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

  // Filtre secteur élargi (cf. lib/sectors.ts). Cumule avec les autres
  // conditions via AND. Le secteur Transport ratisse CPV 60/34/50.1x/63
  // + une vingtaine de mots-clés métier (navette, TPMR, fret, …).
  if (sector === 'transport') {
    const sectorOR: any[] = [];
    for (const prefix of TRANSPORT_CPV_PREFIXES) {
      sectorOR.push({ codeCPV: { startsWith: prefix } });
    }
    for (const kw of TRANSPORT_KEYWORDS) {
      sectorOR.push({ objet: { contains: kw, mode: 'insensitive' } });
      sectorOR.push({ labelCPV: { contains: kw, mode: 'insensitive' } });
    }
    where.AND = [...(where.AND || []), { OR: sectorOR }];
  }

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
        where: { titulaireNom: { not: { startsWith: 'Titulaire ' } } },
        _count: true,
        orderBy: { _count: { titulaireNom: 'desc' } },
        take: 1,
      }),
    ]);

  // Enrich with entreprise data
  const sirens = new Set<string>();
  for (const m of data) {
    if (m.titulaireSiret && m.titulaireSiret.length >= 9) {
      sirens.add(extractSiren(m.titulaireSiret));
    }
  }

  const entreprises = sirens.size > 0
    ? await prisma.entreprise.findMany({
        where: { siren: { in: Array.from(sirens) } },
      })
    : [];
  const entrepriseMap = new Map(entreprises.map(e => [e.siren, e]));

  const enrichedData = data.map(m => {
    if (m.titulaireSiret && m.titulaireSiret.length >= 9) {
      const siren = extractSiren(m.titulaireSiret);
      const ent = entrepriseMap.get(siren);
      if (ent) {
        return { ...m, entreprise: ent };
      }
    }
    return m;
  });

  const res = NextResponse.json({
    data: enrichedData,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit),
      isPaid,
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
  res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res;
}
