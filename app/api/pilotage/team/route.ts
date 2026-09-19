import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Liste des commerciaux (role PROSPECTOR) pour le sélecteur d'assignation
 * de mission côté admin. Réservé à l'admin : un employé n'a pas besoin de
 * connaître la liste de ses collègues pour utiliser le portail.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const team = await prisma.user.findMany({
    where: { role: 'PROSPECTOR' },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { assignedMissions: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(team.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    activeMissionsCount: t._count.assignedMissions,
  })));
}
