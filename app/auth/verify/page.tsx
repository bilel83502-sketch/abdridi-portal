'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erreur de vérification.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur de connexion au serveur.');
      });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: 40, background: '#fff', border: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '0.1em' }}>AB DRIDI</span>
        </div>

        {status === 'loading' && (
          <p style={{ fontSize: 14, color: '#64748B' }}>Vérification en cours...</p>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 16px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Email vérifié !</h1>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>{message}</p>
            <Link href="/auth/login" style={{
              display: 'inline-block', padding: '12px 32px', background: '#3B82F6',
              color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}>
              Se connecter
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Vérification échouée</h1>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>{message}</p>
            <Link href="/auth/login" style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>}><VerifyContent /></Suspense>;
}
