import { TOTP, generateSecret as otpGenerateSecret, generateURI, verifySync } from 'otplib';
import crypto from 'crypto';

const totp = new TOTP({ digits: 6, period: 30 });

/**
 * Generate a new TOTP secret for a user.
 */
export function generateSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = otpGenerateSecret();
  const otpauthUrl = generateURI({
    issuer: 'AB DRIDI Portal',
    label: email,
    secret,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  });
  return { secret, otpauthUrl };
}

/**
 * Verify a TOTP token against a secret.
 */
export function verifyToken(token: string, secret: string): boolean {
  const result = verifySync({ token, secret, digits: 6, period: 30, algorithm: 'sha1' });
  return result.valid;
}

/**
 * Generate 10 backup codes (8 chars each, hex).
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
}

/**
 * Hash a backup code for storage.
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toLowerCase().trim()).digest('hex');
}

/**
 * Verify a backup code against hashed codes. Returns the index if found, -1 otherwise.
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashed = hashBackupCode(code);
  return hashedCodes.indexOf(hashed);
}
