'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) { setError('Email ou mot de passe incorrect.'); setLoading(false); }
    else { router.push('/dashboard'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#06080F' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #00C2FF, transparent 70%)' }} />
        <div className="absolute -bottom-[300px] -left-[200px] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }} />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10 animate-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg text-bg"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #6366F1, #A855F7)' }}>A</div>
            <div className="text-left">
              <div className="text-xl font-extrabold tracking-[4px]"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #6366F1, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DRIDI</div>
              <div className="text-[9px] font-medium tracking-[3px] text-txt-faint uppercase">Portail Client</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-txt tracking-tight">Connexion</h1>
          <p className="text-sm text-txt-muted mt-2">Accédez à vos marchés publics</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 animate-in-d1">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="vous@entreprise.com" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" /> : 'Se connecter'}
          </button>
        </form>
        <div className="mt-8 text-center animate-in-d2">
          <p className="text-sm text-txt-faint">Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-accent-cyan hover:text-white transition-colors font-medium">Créer un compte</Link>
          </p>
        </div>
        <div className="mt-6 text-center animate-in-d3">
          <Link href="https://abdridi.com" className="text-xs text-txt-faint hover:text-txt-muted transition-colors">← Retour au site</Link>
        </div>
        <div className="mt-8 p-3 rounded-lg border border-white/[0.04] bg-white/[0.02] animate-in-d4">
          <p className="text-[11px] text-txt-faint text-center">
            <span className="text-accent-green font-semibold">Démo</span> : demo@abdridi.com / demo2026
          </p>
        </div>
      </div>
    </div>
  );
}
