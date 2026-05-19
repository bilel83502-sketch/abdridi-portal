import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]/plan
 * Body: { action: 'GRANT_VEILLE' | 'REVOKE_VEILLE' }
 *
 * Réservé aux utilisateurs ADMIN. Permet d'attribuer ou de retirer le plan
 * VEILLE (accès complet) à un utilisateur SANS le passer ADMIN.
 *
 * GRANT_VEILLE  → plan='VEILLE', stripeCurrentPeriodEnd=now+100 ans, emailVerified=now si null
 * REVOKE_VEILLE → plan='DECOUVERTE', stripeCurrentPeriodEnd=null
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    const { action } = await req.json();
    if (action !== 'GRANT_VEILLE' && action !== 'REVOKE_VEILLE') {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true, plan: true, emailVerified: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Protection : on n'autorise PAS de retirer son propre accès admin par cette voie
    if (target.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Impossible de modifier le plan d\'un administrateur via cette action.' },
        { status: 400 }
      );
    }

    let updateData: any;
    let auditAction: string;

    if (action === 'GRANT_VEILLE') {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      updateData = {
        plan: 'VEILLE',
        stripeCurrentPeriodEnd: farFuture,
        emailVerified: target.emailVerified ?? new Date(),
      };
      auditAction = 'ADMIN_GRANT_VEILLE';
    } else {
      updateData = {
        plan: 'DECOUVERTE',
        stripeCurrentPeriodEnd: null,
      };
      auditAction = 'ADMIN_REVOKE_VEILLE';
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: auditAction,
      resource: 'User',
      metadata: { targetUserId: target.id, targetEmail: target.email, previousPlan: target.plan, newPlan: updated.plan },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        plan: updated.plan,
        role: updated.role,
        hasSub: !!(updated.stripeCurrentPeriodEnd && new Date(updated.stripeCurrentPeriodEnd) > new Date()),
      },
    });
  } catch (e: any) {
    console.error('Admin plan toggle error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
