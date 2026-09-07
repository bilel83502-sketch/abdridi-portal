import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditFromSession } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  siret: z.string().max(20).optional(),
  sector: z.string().max(100).optional(),
  marketingConsent: z.boolean().optional(),
  onboardingDismissed: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Données invalides.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) data.name = d.name.trim();
  if (d.company !== undefined) data.company = d.company.trim() || null;
  if (d.phone !== undefined) data.phone = d.phone.trim() || null;
  if (d.siret !== undefined) data.siret = d.siret.trim() || null;
  if (d.sector !== undefined) data.sector = d.sector.trim() || null;
  if (d.marketingConsent !== undefined) {
    data.marketingConsent = d.marketingConsent;
    data.marketingConsentDate = d.marketingConsent ? new Date() : null;
  }
  if (d.onboardingDismissed !== undefined) data.onboardingDismissed = d.onboardingDismissed;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucune donnée à mettre à jour.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { email: user.email },
    data,
    select: { id: true, name: true, company: true, phone: true, siret: true, sector: true },
  });

  auditFromSession(user, req, 'PROFILE_UPDATED', 'User', updated.id, data);

  return NextResponse.json(updated);
}
