'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, AlertTriangle, Download, Save } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { useModalKeyboard } from '@/hooks/useModalKeyboard';
import FocusTrap from 'focus-trap-react';

export default function ParametresPage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  const toast = useToast();

  // Profile form
  const [profile, setProfile] = useState({ name: '', company: '', phone: '', siret: '', sector: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Marketing consent
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [marketingLoading, setMarketingLoading] = useState(false);

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Data export
  const [exportLoading, setExportLoading] = useState(false);

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const closeDeleteModal = useCallback(() => { setShowDeleteModal(false); setDeleteError(''); setDeletePassword(''); }, []);
  useModalKeyboard({ isOpen: showDeleteModal, onClose: closeDeleteModal });

  // Load profile data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        company: user.company || '',
        phone: user.phone || '',
        siret: user.siret || '',
        sector: user.sector || '',
      });
      // Load marketing consent
      fetch('/api/user/profile').catch(() => {});
    }
  }, [user]);

  useEffect(() => { document.title = 'Paramètres | AB DRIDI'; }, []);

  async function handleSaveProfile() {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success('Profil mis à jour.');
        updateSession();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la mise à jour.');
      }
    } catch {
      toast.error('Erreur de connexion.');
    }
    setProfileLoading(false);
  }

  async function handleToggleMarketing() {
    setMarketingLoading(true);
    const newValue = !marketingConsent;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingConsent: newValue }),
      });
      if (res.ok) {
        setMarketingConsent(newValue);
        toast.success(newValue ? 'Emails marketing activés.' : 'Emails marketing désactivés.');
      }
    } catch {}
    setMarketingLoading(false);
  }

  async function handleExportData() {
    setExportLoading(true);
    try {
      const res = await fetch('/api/user/data');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'mes-donnees.json';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Données téléchargées.');
      } else {
        toast.error('Erreur lors de l\'export.');
      }
    } catch {
      toast.error('Erreur de connexion.');
    }
    setExportLoading(false);
  }

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
        <p className="text-[13px] text-gray-500 mt-0.5">Informations entreprise, abonnement et données personnelles.</p>
      </div>

      {/* Company info — editable */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" /> Entreprise
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Contact principal', k: 'name' as const, id: 'profile-name' },
            { l: 'Email', v: user?.email || '', disabled: true, id: 'profile-email' },
            { l: 'Raison sociale', k: 'company' as const, id: 'profile-company' },
            { l: 'Téléphone', k: 'phone' as const, id: 'profile-phone' },
            { l: 'SIRET', k: 'siret' as const, id: 'profile-siret' },
            { l: 'Secteur d\'activité', k: 'sector' as const, id: 'profile-sector' },
          ].map((f, i) => (
            <div key={i}>
              <label htmlFor={f.id} className="label">{f.l}</label>
              {f.disabled ? (
                <input id={f.id} value={f.v} disabled className="input !bg-gray-50 !text-gray-400" />
              ) : (
                <input
                  id={f.id}
                  value={profile[f.k!]}
                  onChange={e => setProfile(p => ({ ...p, [f.k!]: e.target.value }))}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={profileLoading}
          className="btn-primary !text-xs mt-4"
          style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: profileLoading ? 0.6 : 1 }}
        >
          <Save size={13} /> {profileLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Subscription */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-3.5">Abonnement</h2>
        <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex justify-between items-center">
          <div>
            <div className="text-[15px] font-bold">
              <span className="gradient-text">{user?.plan === 'VEILLE' ? 'Veille & Accompagnement' : 'Découverte'}</span>
              <span className="font-normal text-gray-500 text-[13px] ml-2">
                {user?.plan === 'VEILLE' ? '— 150€/mois' : '— Gratuit'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user?.plan === 'VEILLE' ? 'Recherche illimitée · Alertes quotidiennes · Accès toutes sources' : '3 consultations/jour · Recherche basique · Toutes sources'}</p>
          </div>
          <span className="px-3 py-[3px] rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Actif</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-sm font-bold mb-4">Notifications</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Alertes email marchés publics</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Recevez les nouvelles consultations correspondant à vos alertes</div>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: '#3B82F6' }} />
          </div>
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Emails marketing AB DRIDI</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Actualités, conseils marchés publics (1×/mois max)</div>
            </div>
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={handleToggleMarketing}
              disabled={marketingLoading}
              style={{ width: 20, height: 20, accentColor: '#3B82F6' }}
            />
          </div>
        </div>
      </div>

      {/* Données personnelles (RGPD) */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-3.5">Données personnelles</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 1.6 }}>
          Conformément au RGPD (art. 20), vous pouvez télécharger toutes vos données personnelles au format JSON.
        </p>
        <button
          onClick={handleExportData}
          disabled={exportLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', background: '#fff', color: '#3B82F6',
            border: '1px solid #3B82F6', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', borderRadius: 6, opacity: exportLoading ? 0.6 : 1,
          }}
        >
          <Download size={14} /> {exportLoading ? 'Export en cours...' : 'Télécharger mes données'}
        </button>
      </div>

      {/* Password */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-3.5">Mot de passe</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
          Pour des raisons de sécurité, le changement de mot de passe se fait par email.
        </p>
        {resetSent ? (
          <div style={{ padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46' }}>
            Un email de réinitialisation a été envoyé à {user?.email}.
          </div>
        ) : (
          <button onClick={handleRequestReset} disabled={resetLoading} style={{
            padding: '10px 20px', background: '#3B82F6', color: '#fff',
            border: 'none', fontWeight: 600, fontSize: 13, cursor: resetLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: resetLoading ? 0.6 : 1, borderRadius: 6,
          }}>
            {resetLoading ? 'Envoi...' : 'Modifier mon mot de passe'}
          </button>
        )}
      </div>

      {/* Zone de danger */}
      <div className="card p-6" style={{ border: '1px solid #991B1B' }}>
        <h2 className="text-[13px] font-bold mb-3 flex items-center gap-2" style={{ color: '#EF4444' }}>
          <AlertTriangle size={16} /> Zone de danger
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 1.6 }}>
          La suppression est irréversible. Données personnelles, alertes, favoris et missions seront supprimées.
          Les données de facturation seront conservées 10 ans (obligation légale). Les logs d&apos;audit seront anonymisés.
        </p>
        <button onClick={() => setShowDeleteModal(true)} style={{
          padding: '10px 20px', background: 'rgba(239,68,68,0.1)', color: '#EF4444',
          border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit', borderRadius: 6,
        }}>
          Supprimer mon compte
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <FocusTrap>
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <h3 id="delete-modal-title" style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Supprimer votre compte</h3>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px' }}>
              Cette action est irréversible. Seront supprimés : profil, alertes, favoris, rendez-vous, missions et prospects.
            </p>
            {deleteError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, borderRadius: 6, marginBottom: 12 }}>{deleteError}</div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Confirmez avec votre mot de passe</label>
              <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Votre mot de passe"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={closeDeleteModal}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button
                onClick={async () => {
                  setDeleteLoading(true); setDeleteError('');
                  try {
                    const res = await fetch('/api/user/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: deletePassword }) });
                    const data = await res.json();
                    if (!res.ok) { setDeleteError(data.error || 'Erreur.'); setDeleteLoading(false); return; }
                    signOut({ callbackUrl: '/auth/login?deleted=true' });
                  } catch { setDeleteError('Erreur de connexion.'); setDeleteLoading(false); }
                }}
                disabled={deleteLoading || !deletePassword}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 6, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleteLoading || !deletePassword ? 0.5 : 1 }}>
                {deleteLoading ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
