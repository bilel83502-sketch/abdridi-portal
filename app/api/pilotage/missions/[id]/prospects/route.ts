import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectCreateSchema } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });

  const body = await req.json();
  const items: any[] = Array.isArray(body) ? body : [body];

  // Validate and normalize
  const valid = items
    .map(p => {
      const normalized = {
        company: (p.company || p.Entreprise || '').trim(),
        contact: (p.contact || p.Contact || '').trim() || null,
        phone: (p.phone || p.Telephone || p['Téléphone'] || '').trim() || null,
        email: (p.email || p.Email || '').trim() || null,
      };
      return prospectCreateSchema.safeParse(normalized).success ? normalized : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && !!p.company);

  if (valid.length === 0) {
    return NextResponse.json({ error: 'Aucun prospect valide' }, { status: 400 });
  }

  const prospects = await prisma.prospect.createMany({
    data: valid.map(p => ({ missionId: params.id, ...p })),
  });

  auditFromSession(user, req, 'PROSPECT_BULK_CREATE', 'Mission', params.id, { count: prospects.count });

  return NextResponse.json({ created: prospects.count }, { status: 201 });
}
