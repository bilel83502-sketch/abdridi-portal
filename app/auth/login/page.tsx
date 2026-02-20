'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
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
      router.push('/dashboard');
    }
  }

  return (
    <div className="login-page">
      {/* Left panel - Desktop only */}
      <div className="login-left">
        {/* Decorative elements */}
        <div className="login-deco login-deco-1" />
        <div className="login-deco login-deco-2" />
        <div className="login-deco login-deco-3" />
        <div className="login-deco login-deco-4" />

        <div className="login-left-content">
          <Image
            src="/logo.png"
            alt="AB DRIDI"
            width={120}
            height={120}
            className="login-left-logo"
          />
          <h1 className="login-left-title">AB DRIDI</h1>
          <p className="login-left-slogan">
            Votre plateforme de veille sur les marchés publics
          </p>
          <div className="login-left-stats">
            {[
              { n: '500K+', t: 'consultations/an' },
              { n: '93', t: 'sources officielles' },
              { n: '101', t: 'départements couverts' },
            ].map((s, i) => (
              <div key={i} className="login-left-stat">
                <div className="login-left-stat-n">{s.n}</div>
                <div className="login-left-stat-t">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="login-right">
        {/* Mobile header */}
        <div className="login-mobile-header">
          <div className="login-mobile-logo-wrap">
            <Image
              src="/logo.png"
              alt="AB DRIDI"
              width={60}
              height={60}
            />
          </div>
          <h1 className="login-mobile-title">AB DRIDI</h1>
          <p className="login-mobile-subtitle">Espace Client</p>
        </div>

        <div className="login-form-wrapper">
          {/* Desktop logo in form */}
          <div className="login-form-logo">
            <Image
              src="/logo.png"
              alt="AB DRIDI"
              width={48}
              height={48}
              className="login-form-logo-img"
            />
            <div>
              <div className="login-form-brand">AB DRIDI</div>
              <div className="login-form-brand-sub">Espace Client</div>
            </div>
          </div>

          <h2 className="login-form-title">Connexion</h2>

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
                <a href="mailto:contact@abdridi.com?subject=Réinitialisation mot de passe" className="login-forgot">
                  Mot de passe oublié ?
                </a>
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

          <div className="login-separator">
            <span>ou</span>
          </div>

          <a
            href="mailto:contact@abdridi.com?subject=Demande d'essai gratuit – AB DRIDI&body=Bonjour,%0A%0AJe souhaite demander un essai gratuit de la plateforme AB DRIDI.%0A%0AMerci."
            className="login-create-account"
          >
            Demander un essai gratuit
          </a>

          <div className="login-demo">
            <span className="login-demo-badge">Démo</span>
            demo@abdridi.com / demo2026
          </div>
        </div>
      </div>
    </div>
  );
}
