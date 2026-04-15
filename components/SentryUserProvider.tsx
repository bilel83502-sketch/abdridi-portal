'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Syncs the authenticated user to Sentry context.
 * Sets Sentry.setUser() on login, clears on logout.
 * Only sends id, email, role — never password or tokens.
 */
export default function SentryUserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { id?: string; email?: string; role?: string };
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      } as Record<string, unknown>);
    } else if (status === 'unauthenticated') {
      Sentry.setUser(null);
    }
  }, [session, status]);

  return <>{children}</>;
}
