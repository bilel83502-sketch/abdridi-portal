import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditFromSession } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true, email: true, name: true, company: true, phone: true, siret: true, sector: true,
      role: true, plan: true, createdAt: true, lastLoginAt: true, emailVerified: true,
      twoFactorEnabled: true,
      consentDate: true, consentIP: true, consentVersion: true,
      marketingConsent: true, marketingConsentDate: true,
      stripeCustomerId: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true,
      alerts: { select: { id: true, keywords: true, natures: true, departments: true, frequency: true, active: true, createdAt: true } },
      favoris: { select: { id: true, marcheId: true, createdAt: true } },
      appointments: { select: { id: true, subject: true, status: true, requestedDate: true, createdAt: true } },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // Audit logs for this user
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: dbUser.id },
    select: { action: true, resource: true, createdAt: true, ipAddress: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Cookie consents
  const cookieConsents = await prisma.cookieConsent.findMany({
    where: { userId: dbUser.id },
    select: { accepted: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const exportData = {
    _metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: 'v1.0',
      description: 'Export complet des données personnelles conformément à l\'article 20 du RGPD.',
    },
    profil: {
      email: dbUser.email,
      nom: dbUser.name,
      entreprise: dbUser.company,
      telephone: dbUser.phone,
      siret: dbUser.siret,
      secteur: dbUser.sector,
      role: dbUser.role,
      plan: dbUser.plan,
      dateInscription: dbUser.createdAt,
      derniereConnexion: dbUser.lastLoginAt,
      emailVerifie: dbUser.emailVerified,
      doubleAuthentification: dbUser.twoFactorEnabled,
    },
    consentements: {
      dateConsentement: dbUser.consentDate,
      versionPolitique: dbUser.consentVersion,
      ipConsentement: dbUser.consentIP,
      consentementMarketing: dbUser.marketingConsent,
      dateConsentementMarketing: dbUser.marketingConsentDate,
      cookieConsents,
    },
    abonnement: {
      stripeCustomerId: dbUser.stripeCustomerId,
      stripeSubscriptionId: dbUser.stripeSubscriptionId,
      finPeriode: dbUser.stripeCurrentPeriodEnd,
    },
    alertes: dbUser.alerts,
    favoris: dbUser.favoris,
    rendezvous: dbUser.appointments,
    historiqueConnexions: auditLogs,
  };

  auditFromSession(user, req, 'DATA_EXPORT', 'User', dbUser.id);

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="ab-dridi-donnees-${dbUser.email.replace('@', '_')}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
