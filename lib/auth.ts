import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/auth/login' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase().trim() } });
        if (!user || !user.passwordHash) return null;
        if (!(await bcrypt.compare(credentials.password, user.passwordHash))) return null;
        // Update last login
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, company: user.company };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase();
        const isAdminEmail = email === 'bilel83502@gmail.com';

        // Upsert user for Google OAuth
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name: user.name || 'Utilisateur',
              role: isAdminEmail ? 'ADMIN' : 'USER',
              plan: isAdminEmail ? 'VEILLE' : 'DECOUVERTE',
              lastLoginAt: new Date(),
            },
          });
        } else {
          // Force ADMIN role for admin email on every login
          const updateData: any = { lastLoginAt: new Date() };
          if (isAdminEmail && existing.role !== 'ADMIN') {
            updateData.role = 'ADMIN';
          }
          await prisma.user.update({ where: { id: existing.id }, data: updateData });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Set basic fields for ALL providers on sign-in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        token.company = (user as any).company;
      }
      // For Google OAuth, override with DB data (Google user.id is Google ID, not DB ID)
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.company = dbUser.company;
        }
      }
      // Fallback: ensure token.id is always set
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
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
