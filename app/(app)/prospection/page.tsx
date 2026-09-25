'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Calendar, Target, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';

type Mission = {
  id: string; name: string; aoTitle: string | null; deadline: string | null; status: string;
  totalProspects: number; contacted: number; progress: number;
};

const STATUS_OPTIONS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  COMPLETED: { label: 'Terminée', color: '#94A3B8', bg: 'rgba(100,116,139,0.15)' },
  NON_ABOUTIE: { label: 'Non aboutie', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  SIGNEE: { label: 'Devis signé', color: '#34D399', bg: 'rgba(16,185,129,0.22)' },
};
const PAUSED = { label: 'En pause', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };

export default function ProspectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const toast = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN' && user?.role !== 'PROSPECTOR') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => { document.title = 'Prospection | AB DRIDI'; }, []);

  const load = useCallback(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'PROSPECTOR')) {
      fetch('/api/pilotage/missions').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setMissions(d);
      }).catch(() => {});
    }
  }, [user]);

  // Chargement + resynchronisation : au retour sur l'onglet et toutes les 60 s
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    const t = setInterval(load, 60000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(t); };
  }, [load]);

  async function changeStatus(m: Mission, newStatus: string, e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (newStatus === m.status) return;
    if (newStatus !== 'ACTIVE') {
      const label = STATUS_OPTIONS[newStatus]?.label || newStatus;
      if (!confirm(`Marquer « ${m.name} » comme « ${label} » ? L'administrateur sera prévenu.`)) return;
    }
    setSavingId(m.id);
    const res = await fetch(`/api/pilotage/missions/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setSavingId(null);
    if (res.ok) {
      setMissions(prev => prev.map(x => x.id === m.id ? { ...x, status: newStatus } : x));
      toast.success(`Statut mis à jour : ${STATUS_OPTIONS[newStatus]?.label || newStatus}`);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d?.error || 'Impossible de changer le statut');
      load();
    }
  }

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) return null;

  const active = missions.filter(m => m.status === 'ACTIVE' || m.status === 'PAUSED');
  const closed = missions.filter(m => m.status === 'COMPLETED' || m.status === 'NON_ABOUTIE' || m.status === 'SIGNEE');
  const nbActive = missions.filter(m => m.status === 'ACTIVE').length;

  function StatusSelect({ m }: { m: Mission }) {
    if (m.status === 'PAUSED') {
      return (
        <span title="Mise en pause par l'administrateur" style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: PAUSED.bg, color: PAUSED.color }}>
          {PAUSED.label}
        </span>
      );
    }
    const st = STATUS_OPTIONS[m.status] || STATUS_OPTIONS.ACTIVE;
    return (
      <select
        value={m.status}
        disabled={savingId === m.id}
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        onChange={e => changeStatus(m, e.target.value, e)}
        aria-label="Statut de la mission"
        style={{
          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', appearance: 'auto',
          border: `1px solid ${st.color}55`, background: st.bg, color: st.color, opacity: savingId === m.id ? 0.5 : 1,
        }}>
        {Object.entries(STATUS_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
    );
  }

  function Card({ m, dim }: { m: Mission; dim?: boolean }) {
    const aContacter = m.totalProspects - m.contacted;
    const inner = (
      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20, transition: 'border-color 0.15s', cursor: dim ? 'default' : 'pointer', opacity: dim ? 0.65 : 1 }}
        onMouseEnter={e => { if (!dim) e.currentTarget.style.borderColor = '#10B981'; }}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#E2E8F0' }}>{m.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <StatusSelect m={m} />
            {!dim && <ChevronRight size={16} style={{ color: '#64748B' }} />}
          </div>
        </div>
        {m.aoTitle && <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{m.aoTitle}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: aContacter > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
            <Target size={13} /> {aContacter > 0 ? `${aContacter} à contacter` : 'Tous contactés'}
          </span>
          {m.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> {new Date(m.deadline).toLocaleDateString('fr-FR')}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: '#334155' }}>
              <div style={{ width: `${m.progress}%`, height: '100%', borderRadius: 3, background: '#10B981', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{m.progress}%</span>
          </div>
        </div>
      </div>
    );
    // Les missions clôturées ne s'ouvrent plus (lecture/appel désactivés) : on
    // peut seulement les rouvrir via le menu de statut.
    return dim ? inner : <Link href={`/prospection/${m.id}`} style={{ textDecoration: 'none' }}>{inner}</Link>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #10B981, #00C2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Phone size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Prospection</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{nbActive} mission{nbActive > 1 ? 's' : ''} active{nbActive > 1 ? 's' : ''}</p>
        </div>
      </div>

      {active.length === 0 ? (
        <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 48, textAlign: 'center' }}>
          <Phone size={40} style={{ color: '#334155', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Aucune mission active pour le moment</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map(m => <Card key={m.id} m={m} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#64748B', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Clôturées ({closed.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {closed.map(m => <Card key={m.id} m={m} dim />)}
          </div>
        </div>
      )}
    </div>
  );
}
