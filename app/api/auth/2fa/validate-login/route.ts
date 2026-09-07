import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, verifyBackupCode } from '@/lib/two-factor';
import { logAudit } from '@/lib/audit';
import { captureSecurityEvent } from '@/lib/sentry';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * Validate 2FA code during login flow.
 * Called after password is verified but before session is created.
 * Expects: { email, password, code } or { email, password, backupCode }
 */
export async function POST(req: Request) {
  const { email, password, code, backupCode } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Identifiants requis' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  // Re-verify password
  const pwValid = await bcrypt.compare(password, user.passwordHash);
  if (!pwValid) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: '2FA non requis' }, { status: 400 });
  }

  // Try TOTP code
  if (code) {
    const isValid = verifyToken(code, user.twoFactorSecret);
    if (!isValid) {
      logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_FAILED', resource: 'User', success: false, request: req });
      captureSecurityEvent('TWO_FACTOR_FAILED', { userId: user.id });
      return NextResponse.json({ error: 'Code 2FA incorrect' }, { status: 401 });
    }
    return NextResponse.json({ verified: true });
  }

  // Try backup code
  if (backupCode) {
    const idx = verifyBackupCode(backupCode, user.backupCodes);
    if (idx === -1) {
      logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_FAILED', resource: 'User', success: false, request: req, metadata: { method: 'backup_code' } });
      return NextResponse.json({ error: 'Code de secours invalide' }, { status: 401 });
    }

    // Remove used backup code
    const updatedCodes = [...user.backupCodes];
    updatedCodes.splice(idx, 1);
    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: updatedCodes },
    });

    logAudit({ userId: user.id, userEmail: user.email, action: 'BACKUP_CODE_USED', resource: 'User', request: req, metadata: { remainingCodes: updatedCodes.length } });

    return NextResponse.json({ verified: true, remainingBackupCodes: updatedCodes.length });
  }

  return NextResponse.json({ error: 'Code 2FA ou code de secours requis' }, { status: 400 });
}
