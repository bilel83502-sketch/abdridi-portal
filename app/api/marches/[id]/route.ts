import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// French stop words to ignore when extracting keywords
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'en', 'au', 'aux',
  'pour', 'par', 'sur', 'dans', 'avec', 'son', 'ses', 'ce', 'cette', 'ces',
  'ou', 'qui', 'que', 'dont', 'est', 'sont', 'a', 'ont', 'été', 'être',
  'sa', 'se', 'ne', 'pas', 'plus', 'tout', 'tous', 'toute', 'toutes',
  'marché', 'marche', 'lot', 'lots', 'relatif', 'relative', 'objet',
  'travaux', 'services', 'fournitures', 'fourniture', 'service',
  'mise', 'place', 'cadre', 'accord', 'public', 'commune', 'ville',
  'département', 'region', 'communauté', 'communaute', 'agglomération',
]);

function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    .slice(0, 4);
}

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

  // Find similar consultations
  let similar: any[] = [];
  try {
    const keywords = extractKeywords(marche.title || '');

    // Build parameterized query — all keywords use positional params
    const baseParams: any[] = [marche.id, marche.nature, marche.department || '00'];
    const kwClauses: string[] = [];
    for (const kw of keywords) {
      baseParams.push(`%${kw}%`);
      kwClauses.push(`"title" ILIKE $${baseParams.length}`);
    }
    const keywordFilter = kwClauses.length > 0 ? kwClauses.join(' OR ') : 'FALSE';

    similar = await prisma.$queryRawUnsafe(`
      SELECT id, title, buyer, nature, department, "departmentName", deadline, source, "publicationDate"
      FROM "Marche"
      WHERE id != $1
        AND status = 'OUVERT'
        AND nature = $2
        AND (department = $3 OR (${keywordFilter}))
      ORDER BY
        CASE WHEN department = $3 THEN 0 ELSE 1 END,
        "publicationDate" DESC
      LIMIT 5
    `, ...baseParams) as any[];
  } catch (e) {
    // Silently fail — similar consultations are not critical
  }

  const res = NextResponse.json({ ...marche, similar });
  res.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
  return res;
}
