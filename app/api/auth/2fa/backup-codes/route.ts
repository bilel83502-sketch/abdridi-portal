import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyToken, generateBackupCodes, hashBackupCode } from '@/lib/two-factor';
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
    return NextResponse.json({ error: 'Code TOTP requis pour régénérer les codes de secours' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
    return NextResponse.json({ error: '2FA non activé' }, { status: 400 });
  }

  const isValid = verifyToken(code, dbUser.twoFactorSecret);
  if (!isValid) {
    return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
  }

  const rawCodes = generateBackupCodes();
  const hashedCodes = rawCodes.map(hashBackupCode);

  await prisma.user.update({
    where: { id: user.id },
    data: { backupCodes: hashedCodes },
  });

  logAudit({ userId: user.id, userEmail: user.email, action: 'BACKUP_CODES_REGENERATED', resource: 'User', request: req });

  return NextResponse.json({ backupCodes: rawCodes });
}
