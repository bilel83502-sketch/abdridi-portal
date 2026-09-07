'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setDone(true);
      else setError('Erreur lors de la désinscription.');
    } catch {
      setError('Erreur de connexion.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>Désinscription confirmée</h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>
          Vous ne recevrez plus d&apos;emails marketing d&apos;AB DRIDI.
          Vous pouvez réactiver cette option dans vos paramètres à tout moment.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>Désinscription emails marketing</h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
        Confirmez que vous souhaitez ne plus recevoir les emails marketing d&apos;AB DRIDI pour <strong style={{ color: '#E2E8F0' }}>{email}</strong>.
      </p>
      {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleUnsubscribe} disabled={loading || !email} style={{
        padding: '12px 24px', background: '#3B82F6', color: '#fff', border: 'none',
        fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8,
        opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Désinscription...' : 'Confirmer la désinscription'}
      </button>
    </div>
  );
}

export default function UnsubscribePage() {
  return <Suspense fallback={<div>Chargement...</div>}><UnsubscribeContent /></Suspense>;
}
