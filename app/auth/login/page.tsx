'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
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
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) { setError('Email ou mot de passe incorrect.'); setLoading(false); }
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[13px] text-white" style={{ background: 'var(--gradient)' }}>AB</div>
            <div>
              <span className="text-base font-bold text-gray-900">AB </span>
              <span className="text-base font-bold gradient-text">DRIDI</span>
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-gray-900 mb-1.5">Connexion au portail</h1>
          <p className="text-sm text-gray-500 mb-7">Accédez à votre espace de veille sur les marchés publics.</p>

          {error && <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email professionnel</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="vous@entreprise.com" required />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="label mb-0">Mot de passe</label>
                <span className="text-[11px] text-blue-600 cursor-pointer">Oublié ?</span>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gradient w-full !py-3 !text-sm disabled:opacity-50">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            Pas encore client ? <Link href="/auth/register" className="text-blue-600 font-semibold">Demander un accès</Link>
          </p>

          <div className="mt-6 p-2.5 px-3.5 rounded-md bg-gray-50 border border-gray-200">
            <p className="text-[11px] text-gray-500"><span className="font-bold text-emerald-600">Démo</span> — demo@abdridi.com / demo2026</p>
          </div>
        </div>
      </div>

      {/* Right - Dark panel */}
      <div className="w-[44%] relative overflow-hidden flex flex-col justify-center px-14 py-14" style={{ background: 'var(--nav)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'var(--gradient)' }} />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: 'rgba(37,99,235,0.08)' }} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full" style={{ background: 'rgba(124,58,237,0.06)' }} />

        <div className="relative z-10">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[2px] mb-3.5">Plateforme de veille B2B</p>
          <h2 className="text-[26px] font-bold text-gray-100 leading-[1.35] mb-3.5">
            Identifiez les marchés publics pertinents pour votre entreprise.
          </h2>
          <p className="text-sm text-gray-400 mb-9 leading-relaxed">
            AB DRIDI agrège 93 sources officielles et vous alerte en temps réel sur les consultations qui correspondent à votre activité.
          </p>
          <div className="border-t border-gray-800 pt-6 flex gap-8">
            {[
              { n: '500K+', t: 'consultations/an' },
              { n: '93', t: 'sources' },
              { n: '101', t: 'départements' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold text-gray-100">{s.n}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
