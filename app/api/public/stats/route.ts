import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

/**
 * Chiffres publics (site vitrine + accueil du portail) : nombre réel
 * d'appels d'offres ouverts. Mis en cache 1 h côté CDN.
 */
export async function GET(req: Request) {
  const headers = { ...corsHeaders(req.headers.get('origin')), 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' };
  try {
    const open = await prisma.marche.count({ where: { status: 'OUVERT' } });
    return NextResponse.json({ openTenders: open, sources: 35, updatedAt: new Date().toISOString() }, { headers });
  } catch {
    return NextResponse.json({ error: 'indisponible' }, { status: 503, headers });
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
