'use client';

import { useState, useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = document.cookie.split(';').find(c => c.trim().startsWith('cookie_consent='));
    if (!consent) setShow(true);
  }, []);

  const handleConsent = async (accepted: boolean) => {
    document.cookie = `cookie_consent=${accepted ? 'accepted' : 'declined'}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;

    if (accepted) {
      initAnalytics();
    }

    try {
      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted }),
      });
    } catch { /* silently fail */ }

    setShow(false);
  };

  if (!show) return null;

  const btnStyle = {
    padding: '8px 18px',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontWeight: 600 as const,
    fontSize: 13,
    cursor: 'pointer' as const,
    fontFamily: 'inherit',
    borderRadius: 6,
    background: 'transparent',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0F1724', color: '#fff', padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      borderTop: '1px solid rgba(59,130,246,0.2)',
    }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1, minWidth: 280, margin: 0, lineHeight: 1.5 }}>
        Nous utilisons des cookies essentiels et, avec votre accord, des cookies d&apos;analyse (Google Analytics) pour ameliorer le site.{' '}
        <a href="/confidentialite" style={{ color: '#60A5FA', textDecoration: 'none' }}>En savoir plus</a>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => handleConsent(false)} style={btnStyle}>
          Refuser
        </button>
        <button onClick={() => handleConsent(true)} style={btnStyle}>
          Accepter
        </button>
      </div>
    </div>
  );
}
