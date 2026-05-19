import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { rateLimit } from './rate-limit';
import { logAudit } from './audit';
import { verifyToken, verifyBackupCode } from './two-factor';
import { captureSecurityEvent } from './sentry';
import { ADMIN_EMAIL, isAdminEmail } from './constants';

// Rate limit store keyed by IP — 5 attempts per 15 minutes
function getLoginRateLimitKey(email: string): string {
  return `login:${email.toLowerCase().trim()}`;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/auth/login' },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: { params: { prompt: 'select_account' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { type: 'email' }, password: { type: 'password' }, twoFactorCode: { type: 'text' }, backupCode: { type: 'text' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: max 5 attempts per email per 15 minutes
        const rlKey = getLoginRateLimitKey(credentials.email);
        const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);
        if (!rl.allowed) {
          throw new Error('Trop de tentatives. Réessayez dans 15 minutes.');
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase().trim() } });
        if (!user) return null;
        if (!user.passwordHash) {
          throw new Error('GOOGLE_ACCOUNT');
        }
        if (!(await bcrypt.compare(credentials.password, user.passwordHash))) {
          logAudit({ userEmail: user.email, action: 'LOGIN_FAILED', resource: 'User', success: false });
          return null;
        }

        // 2FA check: if user has 2FA enabled, verify the code
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const tfCode = credentials.twoFactorCode;
          const bkCode = credentials.backupCode;

          if (!tfCode && !bkCode) {
            // Signal to frontend that 2FA is required
            throw new Error('2FA_REQUIRED');
          }

          if (tfCode) {
            const valid = verifyToken(tfCode, user.twoFactorSecret);
            if (!valid) {
              logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_FAILED', resource: 'User', success: false });
              captureSecurityEvent('TWO_FACTOR_FAILED', { userId: user.id });
              throw new Error('2FA_INVALID');
            }
          } else if (bkCode) {
            const idx = verifyBackupCode(bkCode, user.backupCodes);
            if (idx === -1) {
              logAudit({ userId: user.id, userEmail: user.email, action: 'TWO_FACTOR_FAILED', resource: 'User', success: false, metadata: { method: 'backup_code' } });
              throw new Error('2FA_INVALID');
            }
            // Remove used backup code
            const updatedCodes = [...user.backupCodes];
            updatedCodes.splice(idx, 1);
            await prisma.user.update({ where: { id: user.id }, data: { backupCodes: updatedCodes } });
            logAudit({ userId: user.id, userEmail: user.email, action: 'BACKUP_CODE_USED', resource: 'User', metadata: { remainingCodes: updatedCodes.length } });
          }
        }

        // Update last login
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        logAudit({ userId: user.id, userEmail: user.email, userRole: user.role, action: 'LOGIN_SUCCESS', resource: 'User' });
        return { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, company: user.company };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase();
        const adminMatch = isAdminEmail(email);

        // Upsert user for Google OAuth — auto-verified
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name: user.name || 'Utilisateur',
              role: adminMatch ? 'ADMIN' : 'USER',
              plan: adminMatch ? 'VEILLE' : 'DECOUVERTE',
              emailVerified: new Date(),
              lastLoginAt: new Date(),
            },
          });
        } else {
          const updateData: any = { lastLoginAt: new Date() };
          if (adminMatch && existing.role !== 'ADMIN') {
            updateData.role = 'ADMIN';
          }
          if (adminMatch && existing.plan !== 'VEILLE') {
            updateData.plan = 'VEILLE';
          }
          // Mark Google users as verified if not already
          if (!existing.emailVerified) {
            updateData.emailVerified = new Date();
          }
          await prisma.user.update({ where: { id: existing.id }, data: updateData });
        }
      }

      // Block credentials login if email not verified (admins bypass)
      if (account?.provider === 'credentials' && user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (dbUser && !dbUser.emailVerified && dbUser.role !== 'ADMIN' && !isAdminEmail(user.email)) {
          return '/auth/verify-notice';
        }
      }

      // NOTE: 2FA setup enforcement moved to client-side redirect in dashboard
      // to avoid blocking the signIn callback (which prevents session creation)

      return true;
    },
    async jwt({ token, user, account, trigger }) {
      const now = Date.now();

      // Set basic fields for ALL providers on sign-in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        token.company = (user as any).company;
        token.lastActivityAt = now;
        token.issuedAt = now;
        token.lastRoleRefreshAt = now;
      }
      // For Google OAuth, override with DB data (Google user.id is Google ID, not DB ID)
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.company = dbUser.company;
          token.lastRoleRefreshAt = now;
        }
      }
      // Fallback: ensure token.id is always set
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // --- Session security: inactivity timeout (2h) ---
      const lastActivity = (token.lastActivityAt as number) || now;
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (now - lastActivity > TWO_HOURS) {
        logAudit({
          userId: token.id as string,
          userEmail: token.email || undefined,
          action: 'SESSION_EXPIRED',
          resource: 'Session',
          metadata: { reason: 'inactivity', inactiveMs: now - lastActivity },
        });
        // Return empty token to force sign-out
        return { expired: true } as any;
      }

      // --- Refresh role/plan depuis la DB toutes les 5 minutes ---
      // Évite d'avoir à se déconnecter quand on change un rôle / plan en base.
      const FIVE_MINUTES = 5 * 60 * 1000;
      const lastRefresh = (token.lastRoleRefreshAt as number) || 0;
      if (token.email && (now - lastRefresh > FIVE_MINUTES || trigger === 'update')) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: (token.email as string).toLowerCase() },
            select: { id: true, role: true, plan: true, company: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.plan = dbUser.plan;
            token.company = dbUser.company;
          }
        } catch {
          // Si la DB est momentanément indisponible, on garde l'ancien token.
        }
        token.lastRoleRefreshAt = now;
      }

      // --- Garde-fou super-admin : si l'email correspond à ADMIN_EMAIL,
      // on force le rôle ADMIN dans le JWT même si la base dit autre chose.
      // Empêche de se retrouver bloqué après un reset / migration.
      if (token.email && isAdminEmail(token.email as string)) {
        token.role = 'ADMIN';
        token.plan = 'VEILLE';
      }

      // Update last activity
      token.lastActivityAt = now;

      return token;
    },
    async session({ session, token }) {
      // If token was invalidated (inactivity), force sign-out
      if ((token as any).expired) {
        return { ...session, user: undefined, expires: '1970-01-01T00:00:00.000Z' } as any;
      }
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).company = token.company;
      }
      return session;
    },
  },
};
