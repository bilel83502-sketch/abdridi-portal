import { prisma } from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

type UserAccess = {
  role: string;
  plan: string;
  stripeCurrentPeriodEnd: Date | null;
};

/**
 * Check if a user has full (paid) access to the platform.
 * Returns true for ADMIN users or users with an active VEILLE subscription.
 */
export function hasFullAccess(user: UserAccess): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.plan === 'VEILLE' && user.stripeCurrentPeriodEnd && new Date(user.stripeCurrentPeriodEnd) > new Date()) return true;
  return false;
}

/**
 * Get the current user's access level from session + DB.
 * Returns { isPaid, user } or { isPaid: false, user: null } if not authenticated.
 */
export async function getUserAccess(): Promise<{ isPaid: boolean; user: UserAccess | null }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { isPaid: false, user: null };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, plan: true, stripeCurrentPeriodEnd: true },
    });

    if (!user) return { isPaid: false, user: null };
    return { isPaid: hasFullAccess(user), user };
  } catch {
    return { isPaid: false, user: null };
  }
}
