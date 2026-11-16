'use client';

import { useState } from 'react';
import { PC } from '@/components/public/SiteChrome';

const field = { width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${PC.line}`, background: '#0F172A', color: PC.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const };
const label = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: PC.text };

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'portail /contact' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Envoi impossible.');
      setState('done');
    } catch (err: any) {
      setError(err.message || 'Envoi impossible.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div role="status" style={{ padding: 18, borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#A7F3D0', fontSize: 14, lineHeight: 1.6 }}>
        <strong>Merci, votre demande est bien envoyée.</strong><br />Nous vous rappelons sous 24 h ouvrées.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div><label htmlFor="c-name" style={label}>Nom *</label><input id="c-name" name="name" required autoComplete="name" style={field} /></div>
        <div><label htmlFor="c-company" style={label}>Entreprise *</label><input id="c-company" name="company" required autoComplete="organization" style={field} /></div>
        <div><label htmlFor="c-activity" style={label}>Activité *</label><input id="c-activity" name="activity" required placeholder="ex. transport scolaire" style={field} /></div>
        <div><label htmlFor="c-dept" style={label}>Département *</label><input id="c-dept" name="department" required placeholder="ex. 69" style={field} /></div>
        <div><label htmlFor="c-phone" style={label}>Téléphone *</label><input id="c-phone" name="phone" type="tel" required autoComplete="tel" style={field} /></div>
        <div><label htmlFor="c-email" style={label}>Email</label><input id="c-email" name="email" type="email" autoComplete="email" style={field} /></div>
      </div>
      <div><label htmlFor="c-msg" style={label}>Votre besoin</label><textarea id="c-msg" name="message" rows={4} placeholder="Marché visé, date limite, questions…" style={{ ...field, resize: 'vertical' }} /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />
      {state === 'error' && <p role="alert" style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</p>}
      <button type="submit" disabled={state === 'sending'} style={{ padding: '13px 0', borderRadius: 8, border: 'none', background: PC.blue, color: '#fff', fontWeight: 700, fontSize: 15, cursor: state === 'sending' ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: state === 'sending' ? 0.7 : 1 }}>
        {state === 'sending' ? 'Envoi…' : 'Être rappelé'}
      </button>
    </form>
  );
}
