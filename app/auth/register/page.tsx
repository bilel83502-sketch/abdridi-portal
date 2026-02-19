'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Erreur.'); setLoading(false); return; }
    router.push('/auth/login?registered=1');
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[13px] text-white" style={{ background: 'var(--gradient)' }}>AB</div>
          <span className="text-base font-bold text-gray-900">AB </span>
          <span className="text-base font-bold gradient-text">DRIDI</span>
        </div>
        <h1 className="text-[22px] font-bold text-gray-900 mb-1.5">Créer un compte</h1>
        <p className="text-sm text-gray-500 mb-7">Demandez votre accès à la plateforme de veille.</p>
        {error && <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Raison sociale</label><input className="input" value={form.company} onChange={set('company')} placeholder="Votre entreprise" required /></div>
          <div><label className="label">Nom complet</label><input className="input" value={form.name} onChange={set('name')} placeholder="Jean Dupont" required /></div>
          <div><label className="label">Email professionnel</label><input type="email" className="input" value={form.email} onChange={set('email')} placeholder="vous@entreprise.com" required /></div>
          <div><label className="label">Mot de passe</label><input type="password" className="input" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" required minLength={8} /></div>
          <div><label className="label">Confirmer le mot de passe</label><input type="password" className="input" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required /></div>
          <button type="submit" disabled={loading} className="btn-gradient w-full !py-3 !text-sm disabled:opacity-50">{loading ? 'Création...' : 'Créer mon compte'}</button>
        </form>
        <p className="text-center text-[13px] text-gray-500 mt-6">Déjà un compte ? <Link href="/auth/login" className="text-blue-600 font-semibold">Se connecter</Link></p>
      </div>
    </div>
  );
}
