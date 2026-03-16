'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 440, width: '100%', padding: 40, background: '#fff', border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Lien invalide</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link href="/auth/login" style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login?reset=1'), 2000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: 40, background: '#fff', border: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '0.1em' }}>AB DRIDI</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>Nouveau mot de passe</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, textAlign: 'center' }}>Choisissez un nouveau mot de passe sécurisé.</p>

        {success ? (
          <div style={{ padding: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Mot de passe mis à jour !</p>
            <p style={{ fontSize: 13, color: '#047857' }}>Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 caractères"
                required
                minLength={8}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px 0', background: '#3B82F6', color: '#fff',
              border: 'none', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>}><ResetContent /></Suspense>;
}
