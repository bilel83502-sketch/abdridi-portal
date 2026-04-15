'use client';
import { SessionProvider } from 'next-auth/react';
import SentryUserProvider from '@/components/SentryUserProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserProvider>{children}</SentryUserProvider>
    </SessionProvider>
  );
}
