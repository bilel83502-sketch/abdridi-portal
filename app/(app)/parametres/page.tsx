'use client';

import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import { useState } from 'react';

export default function ParametresPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleRequestReset() {
    if (!user?.email) return;
    setResetLoading(true);
    await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    setResetSent(true);
    setResetLoading(false);
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Paramètres</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Informations entreprise et abonnement.</p>
      </div>

      {/* Company info */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" /> Entreprise
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Raison sociale', v: user?.company || '' },
            { l: 'Email', v: user?.email || '', d: true },
            { l: 'Contact principal', v: user?.name || '' },
            { l: 'Téléphone', v: '' },
            { l: 'SIRET', v: '' },
            { l: 'Secteur d\'activité', v: '' },
          ].map((f, i) => (
            <div key={i}>
              <label className="label">{f.l}</label>
              <input defaultValue={f.v} disabled={f.d} className={`input ${f.d ? '!bg-gray-50 !text-gray-400' : ''}`} />
            </div>
          ))}
        </div>
        <button className="btn-primary !text-xs mt-4">Enregistrer</button>
      </div>

      {/* Subscription */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-3.5">Abonnement</h2>
        <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex justify-between items-center">
          <div>
            <div className="text-[15px] font-bold">
              <span className="gradient-text">{user?.plan === 'VEILLE' ? 'Veille & Accompagnement' : 'Découverte'}</span>
              <span className="font-normal text-gray-500 text-[13px] ml-2">
                {user?.plan === 'VEILLE' ? '— 25,90€/mois' : '— Gratuit'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user?.plan === 'VEILLE' ? 'Recherche illimitée · Alertes quotidiennes · Accès toutes sources' : '3 consultations/jour · Recherche basique · Toutes sources'}</p>
          </div>
          <span className="px-3 py-[3px] rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Actif</span>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Besoin d'un accompagnement personnalisé ? — <span className="text-blue-600">contact@abdridi.com</span>
        </p>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="text-[13px] font-bold mb-3.5">Mot de passe</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
          Pour des raisons de sécurité, le changement de mot de passe se fait par email.
        </p>
        {resetSent ? (
          <div style={{ padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46' }}>
            Un email de réinitialisation a été envoyé à {user?.email}.
          </div>
        ) : (
          <button
            onClick={handleRequestReset}
            disabled={resetLoading}
            style={{
              padding: '10px 20px', background: '#3B82F6', color: '#fff',
              border: 'none', fontWeight: 600, fontSize: 13, cursor: resetLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: resetLoading ? 0.6 : 1,
            }}
          >
            {resetLoading ? 'Envoi...' : 'Modifier mon mot de passe'}
          </button>
        )}
      </div>
    </div>
  );
}
