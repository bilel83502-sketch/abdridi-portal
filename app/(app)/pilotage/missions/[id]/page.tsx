'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import { useModalKeyboard } from '@/hooks/useModalKeyboard';
import Link from 'next/link';
import { ChevronLeft, X, FileText, UserPlus, Upload, Trash2, Download, Database, Phone, Check, ExternalLink } from 'lucide-react';

const MISSION_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: '#10B981' },
  { value: 'PAUSED', label: 'En pause', color: '#F59E0B' },
  { value: 'COMPLETED', label: 'Terminée', color: '#64748B' },
  { value: 'NON_ABOUTIE', label: 'Non aboutie', color: '#EF4444' },
];

const CALL_RESULTS = [
  { status: 'PAS_JOIGNABLE', label: 'Pas joignable', color: '#64748B' },
  { status: 'RAPPELER', label: 'Rappeler', color: '#F59E0B' },
  { status: 'PAS_INTERESSE', label: 'Pas intéressé', color: '#EF4444' },
  { status: 'INTERESSE', label: 'Intéressé', color: '#10B981' },
  { status: 'VISIO_PLANIFIEE', label: 'Visio planifiée', color: '#00C2FF' },
  { status: 'REFUSE', label: 'Refusé', color: '#EF4444' },
];

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

const DOC_SINGLE_SLOTS = [
  { type: 'BASE_PROSPECTION', label: 'Base de prospection', accept: '.xlsx,.xls,.csv', color: '#10B981' },
  { type: 'FICHE_RECAP', label: 'Fiche récap', accept: '.pdf,.docx,.doc', color: '#F59E0B' },
];

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'A_CONTACTER', label: 'À contacter' },
  { key: 'interested', label: 'Intéressés' },
  { key: 'devis', label: 'Devis' },
  { key: 'DEVIS_SIGNE', label: 'Signés' },
];

function fileIcon(name: string): { ext: string; color: string } {
  const ext = name.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return { ext: 'PDF', color: '#EF4444' };
  if (['doc', 'docx'].includes(ext)) return { ext: 'DOC', color: '#3B82F6' };
  if (['xls', 'xlsx'].includes(ext)) return { ext: 'XLS', color: '#10B981' };
  if (ext === 'csv') return { ext: 'CSV', color: '#10B981' };
  return { ext: 'FILE', color: '#64748B' };
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function MissionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const user = session?.user as any;
  const [mission, setMission] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const closeAdd = useCallback(() => setShowAdd(false), []);
  useModalKeyboard({ isOpen: showAdd, onClose: closeAdd });
  const [addForm, setAddForm] = useState({ company: '', contact: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [importingDoc, setImportingDoc] = useState<string | null>(null);
  const [activeProspect, setActiveProspect] = useState<string | null>(null);
  const [callResult, setCallResult] = useState('');
  const [callNote, setCallNote] = useState('');
  const [callRdvDate, setCallRdvDate] = useState('');
  const [savingCall, setSavingCall] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, user, router]);

  useEffect(() => { loadMission(); }, [user, params.id]);

  async function loadMission() {
    if (!user || user.role !== 'ADMIN') return;
    const res = await fetch(`/api/pilotage/missions/${params.id}`);
    if (res.ok) setMission(await res.json());
  }

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/pilotage/missions/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadMission();
  }

  async function handleUpload(file: File, type: string) {
    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    await fetch(`/api/pilotage/missions/${params.id}/upload`, { method: 'POST', body: formData });
    setUploading(null);
    loadMission();
  }

  async function handleDelete(docId: string) {
    if (!confirm('Supprimer ce document ?')) return;
    await fetch(`/api/pilotage/missions/${params.id}/documents/${docId}`, { method: 'DELETE' });
    loadMission();
  }

  async function handleImportProspects(docId: string) {
    setImportingDoc(docId);
    const res = await fetch(`/api/pilotage/missions/${params.id}/import-prospects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId }),
    });
    const data = await res.json();
    setImportingDoc(null);
    if (data.imported) {
      alert(`${data.imported} prospect(s) importé(s)`);
      loadMission();
    } else if (data.error) {
      alert(`Erreur : ${data.error}`);
    }
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
    setSavingCall(true);
    await fetch(`/api/pilotage/prospects/${prospectId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPEL', result: callResult, note: callNote || null, status: callResult, rdvDate: callRdvDate || null }),
    });
    setSavingCall(false);
    setActiveProspect(null);
    loadMission();
  }

  async function handleAddProspect() {
    if (!addForm.company.trim()) return;
    setSaving(true);
    await fetch(`/api/pilotage/missions/${params.id}/prospects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setAddForm({ company: '', contact: '', phone: '', email: '' });
    setShowAdd(false);
    setSaving(false);
    loadMission();
  }

  if (status === 'loading' || !mission) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (user?.role !== 'ADMIN') return null;

  const documents: any[] = mission.documents || [];
  const prospects = (mission.prospects || []).filter((p: any) => {
    if (filter === 'all') return true;
    if (filter === 'interested') return ['INTERESSE', 'VISIO_PLANIFIEE'].includes(p.status);
    if (filter === 'devis') return ['DEVIS_ENVOYE', 'DEVIS_SIGNE'].includes(p.status);
    return p.status === filter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/pilotage/missions" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          <ChevronLeft size={14} /> Retour aux missions
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{mission.name}</h1>
              <select value={mission.status} onChange={e => handleStatusChange(e.target.value)}
                style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none',
                  border: `1px solid ${(MISSION_STATUSES.find(s => s.value === mission.status)?.color || '#64748B')}55`,
                  background: `${(MISSION_STATUSES.find(s => s.value === mission.status)?.color || '#64748B')}22`,
                  color: MISSION_STATUSES.find(s => s.value === mission.status)?.color || '#64748B',
                }}>
                {MISSION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 12, color: '#94A3B8' }}>
              {mission.aoReference && <span style={{ fontFamily: 'monospace', color: '#64748B' }}>{mission.aoReference}</span>}
              {mission.deadline && <span>Deadline : {new Date(mission.deadline).toLocaleDateString('fr-FR')}</span>}
              {mission.marche && (
                <Link href={`/marches/${mission.marche.id}`} style={{ color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <ExternalLink size={11} /> Voir l'AO
                </Link>
              )}
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>
            <UserPlus size={14} /> Ajouter un prospect
          </button>
        </div>
      </div>

      {/* Documents section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={15} /> Documents
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {DOC_SINGLE_SLOTS.map(slot => {
            const doc = documents.find((d: any) => d.type === slot.type);
            const isUploading = uploading === slot.type;
            return (
              <div key={slot.type} style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: slot.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{slot.label}</div>
                {doc ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: `${fileIcon(doc.name).color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: fileIcon(doc.name).color, flexShrink: 0 }}>
                        {fileIcon(doc.name).ext}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                        {doc.size && <div style={{ fontSize: 11, color: '#94A3B8' }}>{formatSize(doc.size)}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 8px', borderRadius: 6,
                        background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                      }}><Download size={12} /> Ouvrir</a>
                      {slot.type === 'BASE_PROSPECTION' && (
                        <button onClick={() => handleImportProspects(doc.id)} disabled={importingDoc === doc.id} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 8px', borderRadius: 6,
                          background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                          opacity: importingDoc === doc.id ? 0.5 : 1,
                        }}><Database size={12} /> {importingDoc === doc.id ? 'Import...' : 'Importer'}</button>
                      )}
                      <button onClick={() => handleDelete(doc.id)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 8px', borderRadius: 6,
                        background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', cursor: 'pointer',
                      }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
                    <Upload size={20} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{isUploading ? 'Upload...' : 'Glisser ou cliquer'}</span>
                    <input
                      ref={el => { fileRefs.current[slot.type] = el; }}
                      type="file" accept={slot.accept} style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, slot.type); e.target.value = ''; }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
        {/* DCE documents (multiple) */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DCE ({documents.filter((d: any) => d.type === 'DCE').length})</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
              <Upload size={12} /> Ajouter DCE
              <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'DCE'); e.target.value = ''; }} />
            </label>
          </div>
          {documents.filter((d: any) => d.type === 'DCE').map((doc: any) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 6, background: '#1E293B', borderRadius: 8, border: '1px solid #334155' }}>
              <div style={{ width: 28, height: 28, borderRadius: 5, background: `${fileIcon(doc.name).color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: fileIcon(doc.name).color }}>{fileIcon(doc.name).ext}</div>
              <span style={{ flex: 1, fontSize: 13, color: '#E2E8F0' }}>{doc.name}</span>
              {doc.size && <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatSize(doc.size)}</span>}
              <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', fontSize: 11, textDecoration: 'none', fontWeight: 500 }}>Ouvrir</a>
              <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Trash2 size={13} /></button>
            </div>
          ))}
          {documents.filter((d: any) => d.type === 'DCE').length === 0 && (
            <div style={{ fontSize: 12, color: '#94A3B8', padding: '8px 0' }}>Aucun document DCE</div>
          )}
        </div>

        {/* Extra documents (AUTRE type) */}
        {documents.filter((d: any) => d.type === 'AUTRE').map((doc: any) => (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginTop: 6, background: '#1E293B', borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ width: 28, height: 28, borderRadius: 5, background: `${fileIcon(doc.name).color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: fileIcon(doc.name).color }}>{fileIcon(doc.name).ext}</div>
            <span style={{ flex: 1, fontSize: 13, color: '#E2E8F0' }}>{doc.name}</span>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', fontSize: 11, textDecoration: 'none' }}>Ouvrir</a>
            <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* Add prospect modal */}
      {showAdd && (
        <FocusTrap>
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-prospect-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAdd(false)}>
          <div className="modal-content" style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', width: 440, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 id="add-prospect-title" style={{ fontSize: 17, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Ajouter un prospect</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Entreprise *" value={addForm.company} onChange={v => setAddForm({ ...addForm, company: v })} placeholder="Nom de l'entreprise" />
              <Field label="Contact" value={addForm.contact} onChange={v => setAddForm({ ...addForm, contact: v })} placeholder="Nom du contact" />
              <Field label="Téléphone" value={addForm.phone} onChange={v => setAddForm({ ...addForm, phone: v })} placeholder="06 12 34 56 78" />
              <Field label="Email" value={addForm.email} onChange={v => setAddForm({ ...addForm, email: v })} placeholder="contact@entreprise.fr" />
              <button onClick={handleAddProspect} disabled={saving || !addForm.company.trim()} style={{
                padding: '10px 20px', borderRadius: 8, background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', opacity: saving || !addForm.company.trim() ? 0.5 : 1, marginTop: 4,
              }}>{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: filter === f.key ? '#3B82F6' : '#1E293B', color: filter === f.key ? '#fff' : '#64748B',
            }}>{f.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>{prospects.length} prospect{prospects.length > 1 ? 's' : ''}</span>
      </div>

      {/* Prospects table */}
      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr auto', padding: '10px 16px', borderBottom: '1px solid #334155', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Entreprise</span><span>Contact</span><span>Téléphone</span><span>Statut</span><span>Dernier contact</span><span></span>
        </div>
        {prospects.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Aucun prospect</div>
        ) : (
          prospects.map((p: any) => {
            const st = STATUS_LABELS[p.status] || STATUS_LABELS.A_CONTACTER;
            const isActive = activeProspect === p.id;
            return (
              <div key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr auto', padding: '12px 16px', alignItems: 'center', fontSize: 13, borderLeft: `3px solid ${st.color}` }}>
                  <div>
                    <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{p.company}</span>
                    {p.email && <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.email}</div>}
                    {p.note && <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 }}>{p.note}</div>}
                    {p.activities?.length > 0 && (
                      <button onClick={() => setExpandedHistory(expandedHistory === p.id ? null : p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 10, padding: '2px 0', marginTop: 2 }}>
                        {expandedHistory === p.id ? '▾ Masquer historique' : `▸ ${p.activities.length} activité${p.activities.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                  <span style={{ color: '#94A3B8' }}>{p.contact || '—'}</span>
                  <span style={{ color: '#94A3B8' }}>{p.phone ? <a href={`tel:${p.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>{p.phone}</a> : '—'}</span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                  <span style={{ color: '#64748B', fontSize: 12 }}>{p.lastContactAt ? new Date(p.lastContactAt).toLocaleDateString('fr-FR') : '—'}</span>
                  <button onClick={() => isActive ? setActiveProspect(null) : openCallForm(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 5,
                    background: isActive ? '#334155' : 'rgba(59,130,246,0.1)', color: isActive ? '#94A3B8' : '#3B82F6',
                    fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}><Phone size={11} /> {isActive ? 'Annuler' : 'Logger'}</button>
                </div>
                {isActive && (
                  <div style={{ padding: '10px 16px 14px', background: '#0F172A', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {CALL_RESULTS.map(cr => (
                        <button key={cr.status} onClick={() => setCallResult(cr.status)} style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          border: callResult === cr.status ? `2px solid ${cr.color}` : '1px solid #334155',
                          background: callResult === cr.status ? `${cr.color}22` : 'transparent',
                          color: callResult === cr.status ? cr.color : '#64748B',
                        }}>{cr.label}</button>
                      ))}
                    </div>
                    {callResult === 'VISIO_PLANIFIEE' && (
                      <input type="datetime-local" value={callRdvDate} onChange={e => setCallRdvDate(e.target.value)}
                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 11, outline: 'none' }} />
                    )}
                    {callResult === 'RAPPELER' && (
                      <input type="date" value={callRdvDate} onChange={e => setCallRdvDate(e.target.value)}
                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 11, outline: 'none' }} />
                    )}
                    <input type="text" value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="Note..."
                      style={{ flex: 1, minWidth: 120, padding: '4px 6px', borderRadius: 4, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 11, outline: 'none' }} />
                    <button onClick={() => submitCall(p.id)} disabled={!callResult || savingCall} style={{
                      display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 4,
                      background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                      opacity: !callResult || savingCall ? 0.5 : 1,
                    }}><Check size={11} /> {savingCall ? '...' : 'OK'}</button>
                  </div>
                )}
                {expandedHistory === p.id && p.activities?.length > 0 && (
                  <div style={{ padding: '8px 16px 10px', background: '#0F172A', borderTop: '1px solid #334155' }}>
                    {p.activities.map((a: any) => (
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
          })
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#334155')}
      />
    </div>
  );
}
