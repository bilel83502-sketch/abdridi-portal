'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, Plus, Pause, Play, Trash2, X, Bell, Lock, Pencil, BarChart3, Lightbulb } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { useModalKeyboard } from '@/hooks/useModalKeyboard';
import Link from 'next/link';
import TagInput from '@/components/TagInput';
import DepartmentSelect from '@/components/DepartmentSelect';

function timeAgo(date: string | null): string {
  if (!date) return 'jamais';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const closeForm = useCallback(() => { resetForm(); setShowForm(false); }, []);
  useModalKeyboard({ isOpen: showForm, onClose: closeForm });
  const [isPaid, setIsPaid] = useState(true);

  const [formName, setFormName] = useState('');
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [formNatures, setFormNatures] = useState<string[]>([]);
  const [formDepartments, setFormDepartments] = useState<string[]>([]);
  const [formFrequency, setFormFrequency] = useState('DAILY');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/alertes').then(r => r.json()).then(d => {
      setAlerts(d.alerts || []);
      setIsPaid(d.isPaid ?? false);
      setLoading(false);
    });
  }, []);

  useEffect(() => { document.title = 'Alertes | AB DRIDI'; }, []);

  const activeCount = alerts.filter(a => a.active).length;

  async function toggleAlert(id: string, active: boolean) {
    try {
      const res = await fetch('/api/alertes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Erreur'); return; }
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a));
    } catch { alert('Erreur reseau'); }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Supprimer cette alerte ?')) return;
    try {
      await fetch('/api/alertes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch { alert('Erreur lors de la suppression'); }
  }

  function toggleNature(n: string) { setFormNatures(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]); }
  function resetForm() { setFormName(''); setFormKeywords([]); setFormNatures([]); setFormDepartments([]); setFormFrequency('DAILY'); setFormError(''); setEditingId(null); }
  function openEdit(a: any) { setEditingId(a.id); setFormName(a.name); setFormKeywords(a.keywords || []); setFormNatures(a.natures || []); setFormDepartments(a.departments || []); setFormFrequency(a.frequency || 'DAILY'); setFormError(''); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    if (!formName.trim() || formKeywords.length === 0) return;
    setSaving(true);
    try {
      const payload = { name: formName, keywords: formKeywords, natures: formNatures, departments: formDepartments, frequency: formFrequency };
      const res = editingId
        ? await fetch('/api/alertes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        : await fetch('/api/alertes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Erreur'); setSaving(false); return; }
      if (editingId) { setAlerts(prev => prev.map(a => a.id === editingId ? { ...a, ...payload } : a)); }
      else { setAlerts(prev => [data, ...prev]); }
      resetForm(); setShowForm(false);
    } catch { setFormError('Erreur reseau'); }
    setSaving(false);
  }

  const freqLabels: Record<string, string> = { DAILY: 'Quotidien', IMMEDIATE: 'Immediat', WEEKLY: 'Hebdo' };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px', borderRadius: 8,
    border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0',
    fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#0A1628', margin: '-20px -16px -28px', padding: '24px 24px 32px', minHeight: 'calc(100vh - 64px)' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Alertes email</h1>
            {!loading && isPaid && alerts.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', background: 'rgba(148,163,184,0.1)', padding: '2px 10px', borderRadius: 10 }}>
                {activeCount} active{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Recevez les nouvelles consultations selon vos criteres de veille.</p>
        </div>
        {isPaid && (
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: '#00C2FF', color: '#0A1628', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Plus size={16} strokeWidth={3} /> Creer une alerte
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>

      {/* ── PAYWALL ── */}
      {!loading && !isPaid && (
        <div style={{ background: '#0F172A', borderRadius: 12, border: '1px solid #1E293B', padding: '48px 40px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 16, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={28} style={{ color: '#F59E0B' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Alertes email personnalisees</h2>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 28px' }}>
            Les alertes email sont reservees aux abonnes <strong style={{ color: '#F59E0B' }}>Veille &amp; Accompagnement</strong>.
            Recevez chaque matin les nouveaux marches qui correspondent a vos criteres.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, textAlign: 'left' }}>
            {[
              { n: '1', t: 'Criteres sur mesure', d: 'Mots-cles, departements, secteurs' },
              { n: '2', t: 'Email quotidien', d: 'Nouvelles consultations chaque matin a 8h' },
              { n: '3', t: 'Multi-alertes', d: 'Jusqu\'a 10 alertes simultanees' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid #1E293B', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00C2FF', color: '#0A1628', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 3 }}>{s.t}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <Link href="/abonnement" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', fontSize: 14, fontWeight: 600, background: '#00C2FF', color: '#0A1628', textDecoration: 'none', borderRadius: 8 }}>
            Decouvrir l&apos;offre Veille &amp; Accompagnement
          </Link>
        </div>
      )}

      {/* ── MODAL ── */}
      {isPaid && showForm && (
        <FocusTrap>
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.8)' }} onClick={() => setShowForm(false)} />
          <div className="modal-content" style={{ position: 'relative', width: 520, maxWidth: '90vw', background: '#1E293B', borderRadius: 12, border: '1px solid #334155', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 id="alert-modal-title" style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>{editingId ? 'Modifier l\'alerte' : 'Nouvelle alerte'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="alert-name" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5 }}>Nom de l&apos;alerte *</label>
                <input id="alert-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Transport IDF" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5 }}>Mots-cles *</label>
                <TagInput tags={formKeywords} onChange={setFormKeywords} placeholder="transport, nettoyage, BTP..." />
                <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>Tapez Entree ou virgule pour ajouter</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5 }}>Nature des prestations</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ v: 'SERVICES', l: 'Services' }, { v: 'TRAVAUX', l: 'Travaux' }, { v: 'FOURNITURES', l: 'Fournitures' }].map(n => (
                    <button key={n.v} type="button" onClick={() => toggleNature(n.v)} style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      border: formNatures.includes(n.v) ? '1px solid rgba(0,194,255,0.4)' : '1px solid #334155',
                      background: formNatures.includes(n.v) ? 'rgba(0,194,255,0.1)' : '#0F172A',
                      color: formNatures.includes(n.v) ? '#00C2FF' : '#94A3B8',
                    }}>{n.l}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5 }}>Departements</label>
                <DepartmentSelect multi value={formDepartments} onChange={setFormDepartments} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5 }}>Frequence d&apos;envoi</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ v: 'DAILY', l: 'Quotidien (8h)' }, { v: 'WEEKLY', l: 'Hebdomadaire' }, { v: 'IMMEDIATE', l: 'Immediat' }].map(f => (
                    <button key={f.v} type="button" onClick={() => setFormFrequency(f.v)} style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      border: formFrequency === f.v ? '1px solid rgba(0,194,255,0.4)' : '1px solid #334155',
                      background: formFrequency === f.v ? 'rgba(0,194,255,0.1)' : '#0F172A',
                      color: formFrequency === f.v ? '#00C2FF' : '#94A3B8',
                    }}>{f.l}</button>
                  ))}
                </div>
              </div>
              {formError && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#F87171' }}>{formError}</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} style={{
                  flex: 1, padding: '10px 0', border: '1px solid #334155', background: 'transparent', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#94A3B8',
                }}>Annuler</button>
                <button type="submit" disabled={saving || !formName.trim() || formKeywords.length === 0} style={{
                  flex: 1, padding: '10px 0', border: 'none', background: '#00C2FF', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  color: '#0A1628', opacity: saving ? 0.6 : 1,
                }}>{saving ? 'Sauvegarde...' : editingId ? 'Enregistrer' : 'Creer l\'alerte'}</button>
              </div>
            </form>
          </div>
        </div>
        </FocusTrap>
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748B', padding: '64px 0', fontSize: 14 }}>Chargement...</div>
      ) : !isPaid ? null : alerts.length === 0 ? (
        <div style={{ background: '#0F172A', borderRadius: 12, border: '1px solid #1E293B', padding: '56px 40px', textAlign: 'center', maxWidth: 540, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: 16, background: 'rgba(0,194,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={32} style={{ color: '#00C2FF' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Recevez chaque jour les marches qui vous correspondent</h2>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28, lineHeight: 1.6 }}>Configurez vos criteres de veille et ne ratez plus aucun appel d&apos;offres pertinent.</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, textAlign: 'left' }}>
            {[
              { n: '1', t: 'Choisissez vos criteres', d: 'Secteur, departement, type de marche' },
              { n: '2', t: 'Recevez par email', d: 'Chaque matin a 8h, les nouvelles consultations' },
              { n: '3', t: 'Ne ratez plus rien', d: 'Repondez avant la cloture' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid #1E293B', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00C2FF', color: '#0A1628', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 3 }}>{s.t}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px',
            background: '#00C2FF', color: '#0A1628', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Plus size={16} strokeWidth={3} /> Creer ma premiere alerte
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map(a => (
            <div key={a.id} style={{
              background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12,
              padding: '16px 20px', opacity: a.active ? 1 : 0.55, transition: 'opacity 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{a.name}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: a.active ? 'rgba(0,194,255,0.1)' : 'rgba(100,116,139,0.15)',
                      color: a.active ? '#00C2FF' : '#64748B',
                      border: a.active ? '1px solid rgba(0,194,255,0.25)' : '1px solid #334155',
                    }}>{a.active ? 'Active' : 'En pause'}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#1E293B', color: '#94A3B8' }}>
                      {freqLabels[a.frequency] || a.frequency}
                    </span>
                  </div>
                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {a.keywords?.map((k: string, j: number) => (
                      <span key={`k${j}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(0,194,255,0.1)', color: '#00C2FF', border: '1px solid rgba(0,194,255,0.25)' }}>{k}</span>
                    ))}
                    {a.natures?.map((n: string, j: number) => (
                      <span key={`n${j}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                        {n === 'TRAVAUX' ? 'Travaux' : n === 'SERVICES' ? 'Services' : 'Fournitures'}
                      </span>
                    ))}
                    {a.departments?.map((d: string, j: number) => (
                      <span key={`d${j}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>Dep. {d}</span>
                    ))}
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                    <BarChart3 size={12} style={{ color: '#64748B' }} />
                    <span>
                      {typeof a.lastMatchCount === 'number' ? `${a.lastMatchCount} marche${a.lastMatchCount !== 1 ? 's' : ''} trouve${a.lastMatchCount !== 1 ? 's' : ''}` : '0 marches trouves'}
                      <span style={{ color: '#334155', margin: '0 5px' }}>·</span>
                      Dernier envoi : {timeAgo(a.lastSentAt)}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                  <button onClick={() => openEdit(a)} title="Modifier" style={{
                    width: 32, height: 32, borderRadius: 6, border: '1px solid #1E293B', background: 'rgba(30,41,59,0.5)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                  }}><Pencil size={13} /></button>
                  <button onClick={() => toggleAlert(a.id, a.active)} title={a.active ? 'Mettre en pause' : 'Activer'} style={{
                    width: 32, height: 32, borderRadius: 6, border: '1px solid #1E293B', background: 'rgba(30,41,59,0.5)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                  }}>{a.active ? <Pause size={13} /> : <Play size={13} />}</button>
                  <button onClick={() => deleteAlert(a.id)} title="Supprimer" style={{
                    width: 32, height: 32, borderRadius: 6, border: '1px solid #1E293B', background: 'rgba(30,41,59,0.5)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B',
                  }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}

          {/* Tip */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8,
            padding: '12px 16px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8,
          }}>
            <Lightbulb size={15} style={{ color: '#00C2FF', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: '#00C2FF' }}>Astuce</strong> — Creez plusieurs alertes avec des mots-cles differents pour couvrir tous vos secteurs d&apos;activite.
              Vous pouvez avoir jusqu&apos;a 10 alertes actives.
            </p>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
