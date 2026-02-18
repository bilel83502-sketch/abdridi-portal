'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.password.length < 8) { setError('8 caractères minimum.'); return; }
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, company: form.company, phone: form.phone, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Erreur.'); setLoading(false); return; }
    await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#06080F' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #00C2FF, transparent 70%)' }} />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg text-bg"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #6366F1, #A855F7)' }}>A</div>
            <div className="text-left">
              <div className="text-xl font-extrabold tracking-[4px]"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #6366F1, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DRIDI</div>
              <div className="text-[9px] font-medium tracking-[3px] text-txt-faint uppercase">Créer un compte</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-txt tracking-tight">Inscription</h1>
          <p className="text-sm text-txt-muted mt-2">Commencez votre veille dès aujourd'hui</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 animate-in-d1">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Nom *</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className="input" placeholder="Jean Dupont" required /></div>
            <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Entreprise</label>
              <input type="text" value={form.company} onChange={e => update('company', e.target.value)} className="input" placeholder="Mon entreprise" /></div>
          </div>
          <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input" placeholder="vous@entreprise.com" required /></div>
          <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Téléphone</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input" placeholder="07 XX XX XX XX" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Mot de passe *</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input" placeholder="••••••••" required /></div>
            <div><label className="block text-xs font-medium text-txt-muted mb-1.5">Confirmer *</label>
              <input type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} className="input" placeholder="••••••••" required /></div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 mt-2">
            {loading ? <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" /> : "Créer mon compte"}
          </button>
        </form>
        <div className="mt-6 text-center animate-in-d2">
          <p className="text-sm text-txt-faint">Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-accent-cyan hover:text-white transition-colors font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
