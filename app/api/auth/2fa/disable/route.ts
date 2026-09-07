import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/two-factor';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
    return NextResponse.json({ error: '2FA non activé' }, { status: 400 });
  }

  const isValid = verifyToken(code, dbUser.twoFactorSecret);
  if (!isValid) {
    logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_FAILED', resource: 'User', success: false, request: req });
    return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    },
  });

  logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_DISABLED', resource: 'User', request: req });

  return NextResponse.json({ message: '2FA désactivé' });
}
