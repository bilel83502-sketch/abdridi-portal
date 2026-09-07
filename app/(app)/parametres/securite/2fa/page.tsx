'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TwoFactorSetupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [step, setStep] = useState<'start' | 'scan' | 'verify' | 'done'>('start');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSetup() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erreur');
      setLoading(false);
      return;
    }
    setQrCode(data.qrCode);
    setSecret(data.secret);
    setStep('scan');
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Code incorrect');
      setLoading(false);
      return;
    }
    setBackupCodes(data.backupCodes);
    setStep('done');
    setLoading(false);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#0F1724', padding: '24px 28px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Authentification à deux facteurs
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#94A3B8' }}>
            {isAdmin ? 'Obligatoire pour les comptes administrateur' : 'Sécurisez votre compte'}
          </p>
        </div>

        <div style={{ padding: 28 }}>
          {/* Step: Start */}
          {step === 'start' && (
            <>
              {isAdmin && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, color: '#92400E' }}>
                  En tant qu'administrateur, l'activation du 2FA est obligatoire pour accéder au portail.
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Avant de commencer</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                  Installez une application d'authentification sur votre smartphone :
                </p>
                <ul style={{ fontSize: 13, color: '#64748B', lineHeight: 2, paddingLeft: 20 }}>
                  <li>Google Authenticator</li>
                  <li>Authy</li>
                  <li>Microsoft Authenticator</li>
                </ul>
              </div>
              <button
                onClick={handleSetup}
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 0', background: '#2563EB', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Chargement...' : 'Commencer la configuration'}
              </button>
            </>
          )}

          {/* Step: Scan QR code */}
          {step === 'scan' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Scannez ce QR code avec votre application d'authentification :
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code 2FA" style={{ width: 200, height: 200, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Clé secrète (si vous ne pouvez pas scanner) :</p>
                <code style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', wordBreak: 'break-all' }}>{secret}</code>
              </div>

              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
                Entrez le code à 6 chiffres affiché dans l'application :
              </p>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  style={{
                    flex: 1, padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 8,
                    fontSize: 20, textAlign: 'center', letterSpacing: 8, fontWeight: 700,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                style={{
                  width: '100%', padding: '12px 0', background: '#2563EB', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', opacity: loading || code.length !== 6 ? 0.5 : 1,
                }}
              >
                {loading ? 'Vérification...' : 'Vérifier et activer'}
              </button>
            </>
          )}

          {/* Step: Done — show backup codes */}
          {step === 'done' && (
            <>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: 14, marginBottom: 20, textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>2FA activé avec succès</span>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', margin: '0 0 4px' }}>
                  Codes de secours — NOTEZ-LES MAINTENANT
                </p>
                <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>
                  Ces codes ne seront plus jamais affichés. Conservez-les en lieu sûr.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {backupCodes.map((c, i) => (
                    <code key={i} style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                      {c}
                    </code>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={copyBackupCodes}
                  style={{
                    flex: 1, padding: '10px 0', background: '#F1F5F9', color: '#64748B',
                    border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {copied ? 'Copié !' : 'Copier les codes'}
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  style={{
                    flex: 1, padding: '10px 0', background: '#2563EB', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Continuer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
