'use client';

import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const resetDone = searchParams.get('reset');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/marches');
    }
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div style={{ marginBottom: 32 }}>
            <Image src="/logo.png" alt="AB DRIDI" width={72} height={72} />
          </div>

          <h1 className="login-left-title">
            La veille marchés publics<br />en temps réel
          </h1>
          <p className="login-left-slogan">
            Identifiez les appels d&apos;offres, analysez la concurrence et remportez plus de marchés.
          </p>

          <div className="login-left-stats">
            {[
              { n: '10+', t: 'sources officielles' },
              { n: '100%', t: 'données publiques' },
              { n: '24/7', t: 'mise à jour' },
            ].map((s, i) => (
              <div key={i} className="login-left-stat">
                <div className="login-left-stat-n">{s.n}</div>
                <div className="login-left-stat-t">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-mobile-header">
          <div className="login-mobile-logo-wrap">
            <Image src="/logo.png" alt="AB DRIDI" width={48} height={48} />
          </div>
          <h1 className="login-mobile-title">AB DRIDI</h1>
          <p className="login-mobile-subtitle">Espace Client</p>
        </div>

        <div className="login-form-wrapper">
          <div className="login-form-logo">
            <Image src="/logo.png" alt="AB DRIDI" width={40} height={40} className="login-form-logo-img" />
            <div>
              <div className="login-form-brand">AB DRIDI</div>
              <div className="login-form-brand-sub">Espace Client</div>
            </div>
          </div>

          <h2 className="login-form-title">Connexion</h2>

          {registered && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px',
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              color: '#065F46', fontSize: 13, marginBottom: 20,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Compte créé avec succès. Vérifiez votre email puis connectez-vous.
            </div>
          )}

          {resetDone && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px',
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              color: '#065F46', fontSize: 13, marginBottom: 20,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
            </div>
          )}

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/marches' })}
            className="login-google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="login-separator"><span>ou</span></div>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Email professionnel</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="vous@entreprise.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label">Mot de passe</label>
                <ForgotPasswordLink />
              </div>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input login-input-pw"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>
                  <svg className="login-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '24px' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordLink() {
  const [showForm, setShowForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (resetSent) {
    return <span className="login-forgot" style={{ color: '#059669', cursor: 'default' }}>Email envoyé !</span>;
  }

  if (!showForm) {
    return (
      <button type="button" onClick={() => setShowForm(true)} className="login-forgot" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
        Mot de passe oublié ?
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        type="email"
        value={resetEmail}
        onChange={e => setResetEmail(e.target.value)}
        placeholder="Email"
        style={{ padding: '2px 6px', border: '1px solid #E2E8F0', fontSize: 11, width: 140, fontFamily: 'inherit' }}
      />
      <button
        type="button"
        disabled={resetLoading || !resetEmail}
        onClick={async () => {
          setResetLoading(true);
          await fetch('/api/auth/request-password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: resetEmail }),
          });
          setResetSent(true);
          setResetLoading(false);
        }}
        style={{ padding: '2px 8px', background: '#3B82F6', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {resetLoading ? '...' : 'Envoyer'}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div>Chargement...</div>}><LoginContent /></Suspense>;
}
