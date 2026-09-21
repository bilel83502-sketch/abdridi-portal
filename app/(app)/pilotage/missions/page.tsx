'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import { useModalKeyboard } from '@/hooks/useModalKeyboard';
import Link from 'next/link';
import { FolderOpen, Plus, X, ChevronLeft, Calendar, Users, Target, Search, Trash2, AlertTriangle } from 'lucide-react';
import { getMissionUrgency, URGENCY_STYLE, sortByUrgency, countUrgent } from '@/lib/missionUrgency';

type Mission = {
  id: string; name: string; aoReference: string | null; aoTitle: string | null;
  deadline: string | null; status: string; createdAt: string;
  totalProspects: number; contacted: number; interested: number; progress: number;
  assignedToId: string | null; assignedTo: { id: string; name: string; email: string } | null;
  closedInfo: { byName: string; status: string; at: string } | null;
};

const CLOSED_SEEN_KEY = 'abdridi.missionsClosedSeenAt';

type TeamMember = { id: string; name: string; email: string; activeMissionsCount: number };

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: 'Active', bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  PAUSED: { label: 'En pause', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  COMPLETED: { label: 'Terminée', bg: 'rgba(100,116,139,0.15)', color: '#64748B' },
  NON_ABOUTIE: { label: 'Non aboutie', bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
};

const STATUS_FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'ACTIVE', label: 'Actives' },
  { key: 'PAUSED', label: 'En pause' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'NON_ABOUTIE', label: 'Non abouties' },
];

export default function MissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [missions, setMissions] = useState<Mission[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [closedSeenAt, setClosedSeenAt] = useState<number>(0);
  useEffect(() => {
    try { setClosedSeenAt(Number(localStorage.getItem(CLOSED_SEEN_KEY) || 0)); } catch {}
  }, []);
  function markClosedSeen() {
    const now = Date.now();
    setClosedSeenAt(now);
    try { localStorage.setItem(CLOSED_SEEN_KEY, String(now)); } catch {}
  }
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const closeCreate = useCallback(() => { setShowCreate(false); setCreateError(null); setAoStatus('idle'); setAoResults([]); }, []);
  useModalKeyboard({ isOpen: showCreate, onClose: closeCreate });
  const [form, setForm] = useState({ name: '', aoReference: '', aoTitle: '', deadline: '', ficheRecapUrl: '', marcheId: '' });
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [aoSearch, setAoSearch] = useState('');
  const [aoResults, setAoResults] = useState<any[]>([]);
  const [aoStatus, setAoStatus] = useState<'idle' | 'searching' | 'empty' | 'error'>('idle');
  const [selectedAo, setSelectedAo] = useState<any>(null);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, user, router]);

  useEffect(() => {
    loadMissions();
    // Resynchronisation : les commerciaux peuvent changer un statut à tout moment
    const onFocus = () => loadMissions();
    window.addEventListener('focus', onFocus);
    const t = setInterval(loadMissions, 60000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(t); };
  }, [user]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/pilotage/team').then(r => r.json()).then(d => { if (Array.isArray(d)) setTeam(d); });
    }
  }, [user]);

  async function loadMissions() {
    if (user?.role !== 'ADMIN') return;
    const res = await fetch('/api/pilotage/missions');
    const data = await res.json();
    if (Array.isArray(data)) setMissions(data);
  }

  function handleAoSearch(q: string) {
    setAoSearch(q);
    setSelectedAo(null);
    setForm(f => ({ ...f, marcheId: '' }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setAoResults([]); setAoStatus('idle'); return; }
    setAoStatus('searching');
    searchTimeout.current = setTimeout(async () => {
      try {
        // Les titres d'AO copiés-collés sont souvent tronqués ou trop longs :
        // on interroge sur un extrait significatif plutôt que sur le texte brut.
        const cleaned = q.replace(/[.…]+\s*$/, '').trim();
        const probe = cleaned.length > 60 ? cleaned.slice(0, 60) : cleaned;
        const res = await fetch(`/api/pilotage/marches-search?q=${encodeURIComponent(probe)}`);
        if (!res.ok) { setAoResults([]); setAoStatus('error'); return; }
        const data = await res.json();
        if (Array.isArray(data)) {
          setAoResults(data);
          setAoStatus(data.length === 0 ? 'empty' : 'idle');
        } else {
          setAoResults([]); setAoStatus('error');
        }
      } catch {
        setAoResults([]); setAoStatus('error');
      }
    }, 300);
  }

  function selectAo(ao: any) {
    setSelectedAo(ao);
    setAoSearch('');
    setAoResults([]);
    setForm(f => ({
      ...f,
      marcheId: ao.id,
      name: f.name.trim() || String(ao.title || '').slice(0, 200),
      aoTitle: f.aoTitle || ao.title,
      aoReference: f.aoReference || '',
      deadline: f.deadline || (ao.deadline ? new Date(ao.deadline).toISOString().split('T')[0] : ''),
    }));
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setCreateError('Le nom de la mission est obligatoire. Renseignez-le pour continuer.');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/pilotage/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let detail = '';
        try {
          const data = await res.json();
          detail = typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error ?? '');
        } catch {
          detail = (await res.text().catch(() => '')).slice(0, 300);
        }

        const byStatus: Record<number, string> = {
          400: 'Champs invalides.',
          401: 'Session expirée — reconnectez-vous puis réessayez.',
          403: 'Accès refusé (droits administrateur requis, ou jeton CSRF invalide).',
          413: 'Requête trop volumineuse.',
          429: 'Trop de requêtes — patientez quelques instants.',
        };
        const base = byStatus[res.status]
          || (res.status >= 500
            ? 'Erreur serveur ou base de données indisponible (quota de stockage Neon atteint ?).'
            : `Erreur ${res.status}.`);

        setCreateError(detail ? `${base} ${detail}` : base);
        setSaving(false);
        return;
      }

      setForm({ name: '', aoReference: '', aoTitle: '', deadline: '', ficheRecapUrl: '', marcheId: '' });
      setSelectedAo(null);
      setShowCreate(false);
      setSaving(false);
      loadMissions();
    } catch (err: any) {
      setCreateError(`Impossible de joindre le serveur : ${err?.message || 'erreur réseau'}`);
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/pilotage/missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  }

  async function handleAssign(id: string, assignedToId: string, e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/pilotage/missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: assignedToId || null }),
    });
    const assignee = team.find(t => t.id === assignedToId) || null;
    setMissions(prev => prev.map(m => m.id === id
      ? { ...m, assignedToId: assignedToId || null, assignedTo: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null }
      : m));
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Supprimer cette mission et tous ses prospects ?')) return;
    await fetch(`/api/pilotage/missions/${id}`, { method: 'DELETE' });
    loadMissions();
  }

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (user?.role !== 'ADMIN') return null;

  const byStatus = statusFilter === 'all' ? missions : missions.filter(m => m.status === statusFilter);
  const q = query.trim().toLowerCase();
  const bySearch = q
    ? byStatus.filter(m => [m.name, m.aoTitle, m.aoReference].some(v => (v || '').toLowerCase().includes(q)))
    : byStatus;
  const filtered = sortByUrgency(bySearch);

  const totalProspects = filtered.reduce((s, m) => s + m.totalProspects, 0);
  const totalInteresses = filtered.reduce((s, m) => s + m.interested, 0);
  const urgentCount = countUrgent(filtered.filter(m => m.status === 'ACTIVE'));
  const unassignedActiveCount = filtered.filter(m => m.status === 'ACTIVE' && !m.assignedToId).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/pilotage" style={{ color: '#64748B', display: 'flex' }}><ChevronLeft size={20} /></Link>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #00C2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Missions</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{filtered.length} mission{filtered.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
        }}>
          <Plus size={14} /> Nouvelle mission
        </button>
      </div>

      {/* Clôtures récentes par les commerciaux */}
      {(() => {
        const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const recent = missions
          .filter(m => m.closedInfo && new Date(m.closedInfo.at).getTime() > Math.max(weekAgo, closedSeenAt))
          .sort((a, b) => new Date(b.closedInfo!.at).getTime() - new Date(a.closedInfo!.at).getTime());
        if (recent.length === 0) return null;
        return (
          <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                {recent.length} mission{recent.length > 1 ? 's' : ''} clôturée{recent.length > 1 ? 's' : ''} par vos commerciaux
              </span>
              <button onClick={markClosedSeen} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>Marquer comme vu</button>
            </div>
            {recent.map(m => (
              <Link key={m.id} href={`/pilotage/missions/${m.id}`} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13, color: '#E2E8F0', textDecoration: 'none', padding: '3px 0' }}>
                <span style={{ fontWeight: 700, color: m.closedInfo!.status === 'COMPLETED' ? '#10B981' : '#EF4444', minWidth: 90 }}>
                  {m.closedInfo!.status === 'COMPLETED' ? '✓ Terminée' : '✕ Non aboutie'}
                </span>
                <span style={{ flex: 1 }}>{m.name}</span>
                <span style={{ color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {m.closedInfo!.byName} · {new Date(m.closedInfo!.at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* KPIs — vue d'ensemble pour piloter, pas seulement lister */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MiniStat icon={<FolderOpen size={15} />} label="Missions" value={filtered.length} color="#3B82F6" />
        <MiniStat icon={<Users size={15} />} label="Prospects" value={totalProspects} color="#00C2FF" />
        <MiniStat icon={<Target size={15} />} label="Intéressés" value={totalInteresses} color="#10B981" />
        <MiniStat
          icon={<AlertTriangle size={15} />}
          label="Dépôt sous 7 jours"
          value={urgentCount}
          color={urgentCount > 0 ? '#F59E0B' : '#64748B'}
          highlight={urgentCount > 0}
        />
        <MiniStat
          icon={<Users size={15} />}
          label="Actives non assignées"
          value={unassignedActiveCount}
          color={unassignedActiveCount > 0 ? '#F59E0B' : '#64748B'}
          highlight={unassignedActiveCount > 0}
        />
      </div>

      {/* Status filters + recherche */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: statusFilter === f.key ? '#3B82F6' : '#1E293B', color: statusFilter === f.key ? '#fff' : '#64748B',
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#64748B' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une mission..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <FocusTrap>
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-mission-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreate(false)}>
          <div className="modal-content" style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', width: 520, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 id="create-mission-title" style={{ fontSize: 17, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Nouvelle mission</h2>
              <button onClick={() => setShowCreate(false)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nom de la mission *" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Ex: AO Déchets Grand Est" />

              {/* AO search */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 500 }}>Lier à un AO du portail (optionnel)</label>
                {selectedAo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#0F172A', border: '1px solid #334155' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAo.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{selectedAo.buyer} · {selectedAo.nature}</div>
                    </div>
                    <button onClick={() => { setSelectedAo(null); setForm(f => ({ ...f, marcheId: '' })); }} aria-label="Retirer la sélection" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#64748B' }} />
                    <input value={aoSearch} onChange={e => handleAoSearch(e.target.value)} placeholder="Rechercher par titre..."
                      style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                {aoResults.length === 0 && aoStatus !== 'idle' && (
                  <div style={{ marginTop: 6, fontSize: 12, color: aoStatus === 'error' ? '#FCA5A5' : '#64748B' }}>
                    {aoStatus === 'searching' && 'Recherche en cours...'}
                    {aoStatus === 'empty' && "Aucun AO ouvert ne correspond. Vous pouvez créer la mission sans le lier : renseignez simplement le nom."}
                    {aoStatus === 'error' && "La recherche d'AO est indisponible. Vous pouvez créer la mission sans la lier à un AO."}
                  </div>
                )}
                {aoResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0F172A', border: '1px solid #334155', borderRadius: 8, maxHeight: 200, overflowY: 'auto', zIndex: 10, marginTop: 4 }}>
                    {aoResults.map((ao: any) => (
                      <div key={ao.id} onClick={() => selectAo(ao)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #1E293B', fontSize: 12 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ color: '#E2E8F0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ao.title}</div>
                        <div style={{ color: '#64748B', fontSize: 11 }}>{ao.buyer} · {ao.nature} · {ao.department}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Référence AO" value={form.aoReference} onChange={v => setForm({ ...form, aoReference: v })} placeholder="Ex: DCE-2026-0042" />
              <Field label="Objet de l'AO" value={form.aoTitle} onChange={v => setForm({ ...form, aoTitle: v })} placeholder="Collecte et traitement des déchets..." />
              <Field label="Date limite de dépôt" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} type="date" />
              {createError && (
                <div role="alert" style={{
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
                  color: '#FCA5A5', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.45,
                }}>{createError}</div>
              )}
              <button onClick={handleCreate} disabled={saving} style={{
                padding: '10px 20px', borderRadius: 8, background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1, marginTop: 4,
              }}>{saving ? 'Création...' : 'Créer la mission'}</button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {/* Missions list */}
      {filtered.length === 0 ? (
        <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 48, textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: '#334155', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>
            {q ? `Aucune mission ne correspond à "${query.trim()}"` : statusFilter === 'all' ? 'Aucune mission pour le moment' : 'Aucune mission avec ce statut'}
          </p>
          {statusFilter === 'all' && !q && (
            <button onClick={() => setShowCreate(true)} style={{
              padding: '8px 16px', borderRadius: 8, background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 8,
            }}>Créer votre première mission</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => {
            const badge = STATUS_BADGE[m.status] || STATUS_BADGE.ACTIVE;
            return (
              <Link key={m.id} href={`/pilotage/missions/${m.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20, transition: 'border-color 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#E2E8F0' }}>{m.name}</span>
                      <select value={m.status} onClick={e => e.preventDefault()}
                        onChange={e => handleStatusChange(m.id, e.target.value, e as any)}
                        style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', border: `1px solid ${badge.color}44`, background: badge.bg, color: badge.color, appearance: 'auto' }}>
                        {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={m.assignedToId || ''} onClick={e => e.preventDefault()}
                        onChange={e => handleAssign(m.id, e.target.value, e as any)}
                        title="Assigner à un commercial"
                        style={{
                          padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', appearance: 'auto',
                          border: `1px solid ${m.assignedToId ? '#33415566' : '#F59E0B66'}`,
                          background: m.assignedToId ? 'rgba(100,116,139,0.12)' : 'rgba(245,158,11,0.15)',
                          color: m.assignedToId ? '#94A3B8' : '#F59E0B',
                        }}>
                        <option value="">Non assigné</option>
                        {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {m.aoReference && <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{m.aoReference}</span>}
                      <button onClick={e => handleDelete(m.id, e)} title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 2 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {m.aoTitle && <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{m.aoTitle}</p>}
                  {m.closedInfo && (
                    <p style={{ fontSize: 12, margin: '0 0 12px', color: m.closedInfo.status === 'COMPLETED' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      Clôturée par {m.closedInfo.byName} le {new Date(m.closedInfo.at).toLocaleDateString('fr-FR')} à {new Date(m.closedInfo.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} /> {m.totalProspects} prospect{m.totalProspects > 1 ? 's' : ''}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={13} /> {m.interested} intéressé{m.interested > 1 ? 's' : ''}</span>
                    {m.deadline && (() => {
                      const u = getMissionUrgency(m.deadline);
                      const st = URGENCY_STYLE[u.level];
                      const showBadge = u.level === 'critical' || u.level === 'soon' || u.level === 'expired';
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} /> {new Date(m.deadline).toLocaleDateString('fr-FR')}
                          {showBadge && (
                            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                              {u.label}
                            </span>
                          )}
                        </span>
                      );
                    })()}
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: '#334155' }}>
                        <div style={{ width: `${m.progress}%`, height: '100%', borderRadius: 3, background: m.progress === 100 ? '#10B981' : '#3B82F6', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{m.progress}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div style={{
      background: '#1E293B', borderRadius: 10, padding: '12px 16px',
      border: `1px solid ${highlight ? color + '66' : '#334155'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color }}>
        {icon}
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? color : '#E2E8F0' }}>{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input
        type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#334155')}
      />
    </div>
  );
}
