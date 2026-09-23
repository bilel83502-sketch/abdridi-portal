'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Phone, FileText, ExternalLink, Calendar, Check, Filter, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

/** Transforme la saisie locale du navigateur en date absolue (fuseau inclus). */
function toAbsoluteISO(v: string): string | null {
  if (!v) return null;
  const withTime = v.includes('T') ? v : `${v}T09:00`;
  const d = new Date(withTime); // interprété dans le fuseau du navigateur
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  A_CONTACTER: { label: 'À contacter', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  PAS_JOIGNABLE: { label: 'Pas joignable', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  RAPPELER: { label: 'Rappeler', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  INTERESSE: { label: 'Intéressé', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  VISIO_PLANIFIEE: { label: 'Visio planifiée', color: '#00C2FF', bg: 'rgba(0,194,255,0.15)' },
  DEVIS_ENVOYE: { label: 'Devis envoyé', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  DEVIS_SIGNE: { label: 'Devis signé', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  REFUSE: { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  PAS_INTERESSE: { label: 'Pas intéressé', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const CALL_RESULTS = [
  { status: 'PAS_JOIGNABLE', label: 'Pas joignable', color: '#64748B' },
  { status: 'RAPPELER', label: 'Rappeler', color: '#F59E0B' },
  { status: 'PAS_INTERESSE', label: 'Pas intéressé', color: '#EF4444' },
  { status: 'INTERESSE', label: 'Intéressé', color: '#10B981' },
  { status: 'VISIO_PLANIFIEE', label: 'Visio planifiée', color: '#00C2FF' },
  { status: 'REFUSE', label: 'Refusé', color: '#EF4444' },
  { status: 'DEVIS_ENVOYE', label: 'Devis envoyé', color: '#F59E0B' },
  { status: 'DEVIS_SIGNE', label: 'Devis signé', color: '#10B981' },
];

const PRIORITY_ORDER = ['A_CONTACTER', 'RAPPELER', 'PAS_JOIGNABLE', 'INTERESSE', 'VISIO_PLANIFIEE', 'DEVIS_ENVOYE', 'DEVIS_SIGNE', 'PAS_INTERESSE', 'REFUSE'];

export default function ProspectionMissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const user = session?.user as any;
  const [mission, setMission] = useState<any>(null);
  const [activeProspect, setActiveProspect] = useState<string | null>(null);
  const [callResult, setCallResult] = useState('');
  const [callNote, setCallNote] = useState('');
  const [callRdvDate, setCallRdvDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [loadedActivities, setLoadedActivities] = useState<Record<string, any[]>>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  async function closeMission(newStatus: 'COMPLETED' | 'NON_ABOUTIE') {
    const label = newStatus === 'COMPLETED' ? 'Terminée' : 'Non aboutie';
    if (!confirm(`Marquer cette mission comme « ${label} » ? Elle disparaîtra de votre liste et l'administrateur sera prévenu.`)) return;
    setClosing(true);
    const res = await fetch(`/api/pilotage/missions/${params.missionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setClosing(false);
    if (res.ok) {
      toast.success(`Mission marquée « ${label} »`);
      router.push('/prospection');
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d?.error || 'Impossible de changer le statut');
    }
  }
  const toast = useToast();

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN' && user?.role !== 'PROSPECTOR') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => { loadMission(); }, [user, params.missionId]);

  async function loadMission() {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) return;
    const res = await fetch(`/api/pilotage/missions/${params.missionId}`);
    if (res.ok) setMission(await res.json());
  }

  function openCallForm(id: string) {
    const prospect = (mission?.prospects || []).find((p: any) => p.id === id);
    setActiveProspect(id);
    setCallResult('');
    setCallNote(prospect?.note || '');
    setCallRdvDate('');
  }

  async function submitCall(prospectId: string) {
    if (!callResult) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pilotage/prospects/${prospectId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPEL', result: callResult, note: callNote || null, status: callResult, rdvDate: toAbsoluteISO(callRdvDate) }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const prospect = prospects.find((p: any) => p.id === prospectId);
      toast.success(`Appel logué — ${prospect?.company || 'prospect'} → ${STATUS_LABELS[callResult]?.label || callResult}`);
      setActiveProspect(null);
      loadMission();
    } catch {
      toast.error('Erreur lors de l\'enregistrement de l\'appel');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || !mission) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) return null;

  if (!mission) {
    return (
      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 48, textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>
          Cette mission est introuvable ou ne vous est plus assignée.
        </p>
        <Link href="/prospection" style={{ color: '#10B981', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ← Retour à mes missions
        </Link>
      </div>
    );
  }

  const prospects = [...(mission.prospects || [])].sort((a: any, b: any) => PRIORITY_ORDER.indexOf(a.status) - PRIORITY_ORDER.indexOf(b.status));
  const documents: any[] = mission.documents || [];
  const ficheRecap = documents.find((d: any) => d.type === 'FICHE_RECAP');
  // Tout ce que l'admin a déposé, sauf la base de prospection (déjà importée en prospects) et la fiche récap (affichée à part)
  const dceDocs = documents.filter((d: any) => d.type !== 'BASE_PROSPECTION' && d.type !== 'FICHE_RECAP');
  const rdvs = (mission.prospects || []).filter((p: any) => p.rdvDate).sort((a: any, b: any) => new Date(a.rdvDate).getTime() - new Date(b.rdvDate).getTime());

  // Stats
  const aContacter = prospects.filter((p: any) => p.status === 'A_CONTACTER').length;
  const rappeler = prospects.filter((p: any) => p.status === 'RAPPELER').length;
  const interesses = prospects.filter((p: any) => p.status === 'INTERESSE').length;
  const visios = prospects.filter((p: any) => p.status === 'VISIO_PLANIFIEE').length;
  const devis = prospects.filter((p: any) => ['DEVIS_ENVOYE', 'DEVIS_SIGNE'].includes(p.status)).length;
  const refuses = prospects.filter((p: any) => ['REFUSE', 'PAS_INTERESSE'].includes(p.status)).length;
  const isLowPriority = (s: string) => ['PAS_JOIGNABLE', 'REFUSE', 'PAS_INTERESSE'].includes(s);

  // Filter prospects by selected status
  const FILTER_MAP: Record<string, string[]> = {
    'À contacter': ['A_CONTACTER'],
    'Rappeler': ['RAPPELER'],
    'Intéressés': ['INTERESSE'],
    'Visios': ['VISIO_PLANIFIEE'],
    'Devis': ['DEVIS_ENVOYE', 'DEVIS_SIGNE'],
    'Refusés': ['REFUSE', 'PAS_INTERESSE'],
  };
  const filteredProspects = statusFilter
    ? prospects.filter((p: any) => FILTER_MAP[statusFilter]?.includes(p.status))
    : prospects;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/prospection" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          <ChevronLeft size={14} /> Retour
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0, flex: '1 1 300px' }}>{mission.name}</h1>
          {mission.status === 'ACTIVE' && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => closeMission('COMPLETED')} disabled={closing} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.12)', color: '#10B981', opacity: closing ? 0.5 : 1,
              }}>✓ Marquer terminée</button>
              <button onClick={() => closeMission('NON_ABOUTIE')} disabled={closing} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.10)', color: '#EF4444', opacity: closing ? 0.5 : 1,
              }}>Non aboutie</button>
            </div>
          )}
        </div>
        {mission.marche && (
          <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#94A3B8' }}>
            <span style={{ color: '#E2E8F0', fontWeight: 500, flex: '1 1 100%', fontSize: 13 }}>{mission.marche.title}</span>
            <span><strong style={{ color: '#64748B' }}>Acheteur :</strong> {mission.marche.buyer}</span>
            <span><strong style={{ color: '#64748B' }}>Nature :</strong> {mission.marche.nature}</span>
            <span><strong style={{ color: '#64748B' }}>Dept :</strong> {mission.marche.departmentName || mission.marche.department}</span>
            {mission.marche.deadline && <span><strong style={{ color: '#64748B' }}>Deadline :</strong> {new Date(mission.marche.deadline).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>

      <div className="prospection-layout">
        <div>
          {/* Section 1: Stats bar + Prospect table */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'À contacter', value: aContacter, color: '#3B82F6' },
              { label: 'Rappeler', value: rappeler, color: '#F59E0B' },
              { label: 'Intéressés', value: interesses, color: '#10B981' },
              { label: 'Visios', value: visios, color: '#00C2FF' },
              { label: 'Devis', value: devis, color: '#F59E0B' },
              { label: 'Refusés', value: refuses, color: '#EF4444' },
            ].map(s => {
              const isActive = statusFilter === s.label;
              return (
                <button key={s.label} onClick={() => setStatusFilter(isActive ? null : s.label)} aria-pressed={isActive} style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isActive ? '#fff' : '#94A3B8',
                  padding: '8px 14px', borderRadius: 6, minHeight: 36,
                  background: isActive ? `${s.color}44` : `${s.color}11`,
                  border: isActive ? `2px solid ${s.color}` : `1px solid ${s.color}33`,
                  cursor: s.value > 0 ? 'pointer' : 'default',
                  opacity: s.value === 0 ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.value}</span> {s.label}
                  {isActive && <X size={10} style={{ marginLeft: 2, color: s.color }} />}
                </button>
              );
            })}
            {statusFilter && (
              <button onClick={() => setStatusFilter(null)} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8',
                padding: '4px 8px', borderRadius: 6, background: 'transparent', border: '1px solid #334155',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Filter size={10} /> Tout afficher
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredProspects.length === 0 ? (
              <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                {statusFilter ? `Aucun prospect "${statusFilter}"` : 'Aucun prospect dans cette mission'}
              </div>
            ) : filteredProspects.map((p: any) => {
              const st = STATUS_LABELS[p.status] || STATUS_LABELS.A_CONTACTER;
              const isActive = activeProspect === p.id;
              const dimmed = isLowPriority(p.status);
              return (
                <div key={p.id} style={{ background: '#1E293B', borderRadius: 10, border: `1px solid ${isActive ? '#3B82F6' : '#334155'}`, overflow: 'hidden', opacity: dimmed && !isActive ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${st.color}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{p.company}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {p.contact && <span>{p.contact}</span>}
                        {p.phone && <a href={`tel:${p.phone}`} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>{p.phone}</a>}
                      </div>
                      {p.note && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' }}>{p.note}</div>}
                      {/* Dernière activité inline */}
                      {p.activities?.length > 0 && (() => {
                        const last = p.activities[0]; // activities are ordered desc
                        const lastStatus = STATUS_LABELS[last.result];
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: '#94A3B8' }}>
                            <span style={{ color: '#64748B' }}>{new Date(last.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span style={{ color: lastStatus?.color || '#64748B', fontWeight: 500 }}>{lastStatus?.label || last.result}</span>
                            {last.note && <span style={{ color: '#94A3B8', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{last.note}</span>}
                          </div>
                        );
                      })()}
                      {(p._count?.activities > 1 || (p.activities?.length > 1)) && (
                        <button onClick={() => {
                          if (expandedHistory === p.id) { setExpandedHistory(null); return; }
                          setExpandedHistory(p.id);
                          if (!loadedActivities[p.id]) {
                            fetch(`/api/pilotage/prospects/${p.id}/activity`)
                              .then(res => res.ok ? res.json() : [])
                              .then(data => setLoadedActivities(prev => ({ ...prev, [p.id]: data })));
                          }
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 10, padding: '2px 0', marginTop: 2 }}>
                          {expandedHistory === p.id ? '▾ Masquer historique' : `▸ ${(p._count?.activities || p.activities?.length || 1) - 1} autre${(p._count?.activities || p.activities?.length || 1) > 2 ? 's' : ''} activité${(p._count?.activities || p.activities?.length || 1) > 2 ? 's' : ''}`}
                        </button>
                      )}
                    </div>
                    {!isActive && (
                      <button onClick={() => openCallForm(p.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6,
                        background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 600,
                        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        transition: 'background 0.15s ease',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#3B82F6')}
                      >
                        <Phone size={14} /> Logger
                      </button>
                    )}
                  </div>

                  {isActive && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid #334155' }}>
                      <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 8 }}>Résultat :</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                        {CALL_RESULTS.map(cr => (
                          <button key={cr.status} onClick={() => setCallResult(cr.status)} style={{
                            padding: '8px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', minHeight: 36,
                            border: callResult === cr.status ? `2px solid ${cr.color}` : '1px solid #334155',
                            background: callResult === cr.status ? `${cr.color}22` : 'transparent',
                            color: callResult === cr.status ? cr.color : '#94A3B8',
                          }}>{cr.label}</button>
                        ))}
                      </div>
                      {callResult === 'VISIO_PLANIFIEE' && (
                        <div style={{ marginBottom: 10 }}>
                          <label htmlFor="call-rdv-date" style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Date et heure du RDV</label>
                          <input id="call-rdv-date" type="datetime-local" value={callRdvDate} onChange={e => setCallRdvDate(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: 5, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12, outline: 'none' }} />
                        </div>
                      )}
                      {callResult === 'RAPPELER' && (
                        <div style={{ marginBottom: 10 }}>
                          <label htmlFor="call-rappel-date" style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Date de rappel</label>
                          <input id="call-rappel-date" type="date" value={callRdvDate} onChange={e => setCallRdvDate(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: 5, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12, outline: 'none' }} />
                        </div>
                      )}
                      {callResult && (
                        <div style={{ marginBottom: 10 }}>
                          <label htmlFor="call-note" style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Note (optionnel)</label>
                          <textarea id="call-note" value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="Ex: Rappeler lundi matin, demander M. Dupont..."
                            rows={2}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => submitCall(p.id)} disabled={!callResult || saving} style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6,
                          background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                          opacity: !callResult || saving ? 0.5 : 1,
                        }}><Check size={13} /> {saving ? '...' : 'Valider'}</button>
                        <button onClick={() => setActiveProspect(null)} style={{
                          padding: '6px 12px', borderRadius: 6, background: 'transparent', color: '#64748B', fontSize: 12, border: '1px solid #334155', cursor: 'pointer',
                        }}>Annuler</button>
                      </div>
                    </div>
                  )}
                  {expandedHistory === p.id && (loadedActivities[p.id] || p.activities)?.length > 0 && (
                    <div style={{ padding: '8px 14px 10px', background: '#0F172A', borderTop: '1px solid #334155' }}>
                      {(loadedActivities[p.id] || p.activities).map((a: any) => (
                        <div key={a.id} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 11, color: '#94A3B8', borderBottom: '1px solid #1E293B' }}>
                          <span style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                          <span style={{ color: STATUS_LABELS[a.result]?.color || '#64748B', fontWeight: 500 }}>{a.result || a.action}</span>
                          {a.note && <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>{a.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section 2: Fiche récap */}
          {ficheRecap && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#F59E0B', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} /> Fiche récap — à consulter avant d'appeler
              </h2>
              {ficheRecap.mimeType === 'application/pdf' ? (
                <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', borderBottom: '1px solid #334155' }}>
                    <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ficheRecap.name}</span>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                      <a href={ficheRecap.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>Ouvrir en plein écran</a>
                      <a href={ficheRecap.url} download={ficheRecap.name} style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>Télécharger</a>
                    </div>
                  </div>
                  <iframe
                    src={ficheRecap.url}
                    style={{ width: '100%', height: 600, border: 'none' }}
                    title="Fiche récap"
                  />
                </div>
              ) : (
                <a href={ficheRecap.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', textDecoration: 'none',
                }}>
                  <FileText size={18} style={{ color: '#F59E0B' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{ficheRecap.name}</div>
                    <div style={{ fontSize: 11, color: '#F59E0B' }}>Ouvrir dans un nouvel onglet</div>
                  </div>
                  <ExternalLink size={14} style={{ color: '#F59E0B', marginLeft: 'auto' }} />
                </a>
              )}
            </div>
          )}

          {/* Section 3: DCE documents */}
          {dceDocs.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', margin: '0 0 10px' }}>Documents du dossier</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dceDocs.map((doc: any) => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
                    background: '#1E293B', border: '1px solid #334155', textDecoration: 'none',
                  }}>
                    <FileText size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, flex: 1 }}>{doc.name}</span>
                    <ExternalLink size={12} style={{ color: '#64748B' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: RDVs */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} /> Prochains RDV
          </div>
          {rdvs.length === 0 ? (
            <div style={{ background: '#1E293B', borderRadius: 8, border: '1px solid #334155', padding: 16, textAlign: 'center' }}>
              <Calendar size={20} style={{ color: '#334155', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Aucun RDV planifié</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rdvs.map((p: any) => {
                const d = new Date(p.rdvDate);
                return (
                  <div key={p.id} style={{ background: '#1E293B', borderRadius: 8, border: '1px solid #334155', padding: 12 }}>
                    <div style={{ fontSize: 12, color: '#00C2FF', fontWeight: 600 }}>
                      {d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, marginTop: 4 }}>{p.company}</div>
                    {p.contact && <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.contact}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
