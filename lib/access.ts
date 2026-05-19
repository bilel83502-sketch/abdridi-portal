import { prisma } from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { isAdminEmail } from './constants';

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
 *
 * Safety net : si l'utilisateur connecté correspond à l'email super-admin
 * (lib/constants.ADMIN_EMAIL), on force isPaid = true même si la base
 * indique un autre rôle. Ça évite de se retrouver bloqué après un reset
 * de la base ou une variable d'environnement manquante.
 */
export async function getUserAccess(): Promise<{ isPaid: boolean; user: UserAccess | null }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { isPaid: false, user: null };

    const sessionEmail = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { role: true, plan: true, stripeCurrentPeriodEnd: true },
    });

    // Garde-fou super-admin : si l'email matche, accès total même si l'entrée
    // base est introuvable ou mal configurée (post-reset, post-migration, etc.).
    if (isAdminEmail(sessionEmail)) {
      return {
        isPaid: true,
        user: user ?? { role: 'ADMIN', plan: 'VEILLE', stripeCurrentPeriodEnd: null },
      };
    }

    if (!user) return { isPaid: false, user: null };
    return { isPaid: hasFullAccess(user), user };
  } catch {
    return { isPaid: false, user: null };
  }
}
