'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyNoticePage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: 40, background: '#fff', border: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '0.1em' }}>AB DRIDI</span>
        </div>

        <div style={{ width: 56, height: 56, margin: '0 auto 16px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" />
          </svg>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Vérifiez votre email</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
          Un email de vérification a été envoyé à votre adresse.<br />
          Vérifiez votre boîte de réception (et les spams).
        </p>

        {sent ? (
          <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46', marginBottom: 20 }}>
            Email de vérification renvoyé avec succès.
          </div>
        ) : (
          <form onSubmit={handleResend} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>Vous n&apos;avez pas reçu l&apos;email ?</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', marginBottom: 10,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px 0', background: '#3B82F6',
                color: '#fff', border: 'none', fontWeight: 600, fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
            </button>
          </form>
        )}

        <Link href="/auth/login" style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
