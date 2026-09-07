'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const Sentry = require('@sentry/nextjs');
      Sentry.captureException(error);
    } catch {
      // Sentry not available
    }
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#0F0F23', color: '#E2E8F0', fontFamily: "'Outfit', system-ui, sans-serif", padding: 24, textAlign: 'center',
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16, color: '#F59E0B' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#E2E8F0' }}>
          Oups, une erreur est survenue
        </h1>
        <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 420, lineHeight: 1.6 }}>
          Notre équipe a été notifiée. Réessayez dans quelques instants ou contactez-nous si le problème persiste.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre style={{ fontSize: 11, color: '#EF4444', background: '#1E293B', padding: 12, borderRadius: 8, marginTop: 16, maxWidth: 480, overflow: 'auto', textAlign: 'left' }}>
            {error.message}
          </pre>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => reset()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: '#3B82F6', color: '#fff',
          fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', borderRadius: 8,
          fontFamily: 'inherit',
        }}>
          Réessayer
        </button>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: 'transparent', color: '#94A3B8',
          fontSize: 14, fontWeight: 600, textDecoration: 'none', borderRadius: 8,
          border: '1px solid #334155',
        }}>
          Retour à l&apos;accueil
        </Link>
      </div>
      <p style={{ fontSize: 12, color: '#64748B', marginTop: 48 }}>
        AB DRIDI — <a href="mailto:contact@abdridi.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>contact@abdridi.com</a>
      </p>
    </div>
  );
}
