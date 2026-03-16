'use client';

import { useEffect, useState } from 'react';
import { Mail, Plus, Pause, Play, Trash2, X, Bell } from 'lucide-react';
import TagInput from '@/components/TagInput';
import DepartmentSelect from '@/components/DepartmentSelect';

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [formNatures, setFormNatures] = useState<string[]>([]);
  const [formDepartments, setFormDepartments] = useState<string[]>([]);
  const [formFrequency, setFormFrequency] = useState('DAILY');
  const [formDept, setFormDept] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/alertes').then(r => r.json()).then(d => { setAlerts(d); setLoading(false); });
  }, []);

  async function toggleAlert(id: string, active: boolean) {
    await fetch('/api/alertes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a));
  }

  async function deleteAlert(id: string) {
    await fetch('/api/alertes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function toggleNature(n: string) {
    setFormNatures(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  }

  function addDepartment() {
    if (formDept && !formDepartments.includes(formDept)) {
      setFormDepartments(prev => [...prev, formDept]);
      setFormDept('');
    }
  }

  function resetForm() {
    setFormName(''); setFormKeywords([]); setFormNatures([]);
    setFormDepartments([]); setFormFrequency('DAILY'); setFormDept('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || formKeywords.length === 0) return;
    setSaving(true);
    const res = await fetch('/api/alertes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName,
        keywords: formKeywords,
        natures: formNatures,
        departments: formDepartments,
        frequency: formFrequency,
      }),
    });
    const alert = await res.json();
    setAlerts(prev => [alert, ...prev]);
    resetForm();
    setShowForm(false);
    setSaving(false);
  }

  const freqLabels: Record<string, string> = { DAILY: 'Quotidien', IMMEDIATE: 'Immédiat', WEEKLY: 'Hebdo' };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold">Alertes email</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Recevez les nouvelles consultations selon vos critères de veille.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gradient"><Plus size={15} /> Créer une alerte</button>
      </div>

      {/* ── Creation form modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} onClick={() => setShowForm(false)} />
          <div style={{
            position: 'relative', width: 520, maxWidth: '90vw', background: '#fff',
            padding: 32, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Nouvelle alerte</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Nom de l&apos;alerte <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Transport IDF"
                  required
                  className="input"
                  style={{ height: 40, fontSize: 13 }}
                />
              </div>

              {/* Keywords */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Mots-clés <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <TagInput
                  tags={formKeywords}
                  onChange={setFormKeywords}
                  placeholder="transport, nettoyage, BTP..."
                />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Tapez Entrée ou virgule pour ajouter</p>
              </div>

              {/* Natures */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nature des prestations</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { v: 'SERVICES', l: 'Services' },
                    { v: 'TRAVAUX', l: 'Travaux' },
                    { v: 'FOURNITURES', l: 'Fournitures' },
                  ].map(n => (
                    <button
                      key={n.v}
                      type="button"
                      onClick={() => toggleNature(n.v)}
                      style={{
                        padding: '6px 14px', fontSize: 12, fontWeight: 500,
                        border: formNatures.includes(n.v) ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                        background: formNatures.includes(n.v) ? '#DBEAFE' : '#fff',
                        color: formNatures.includes(n.v) ? '#2563EB' : '#64748B',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {n.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Départements</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <DepartmentSelect value={formDept} onChange={setFormDept} />
                  </div>
                  <button
                    type="button"
                    onClick={addDepartment}
                    style={{
                      padding: '0 16px', height: 40, border: '1px solid #E2E8F0',
                      background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 13, fontWeight: 500, color: '#374151',
                    }}
                  >
                    Ajouter
                  </button>
                </div>
                {formDepartments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {formDepartments.map(d => (
                      <span key={d} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', fontSize: 11, fontWeight: 500,
                        background: '#DBEAFE', color: '#2563EB',
                      }}>
                        Dép. {d}
                        <button type="button" onClick={() => setFormDepartments(prev => prev.filter(x => x !== d))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#2563EB' }}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Frequency */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Fréquence d&apos;envoi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { v: 'DAILY', l: 'Quotidien (8h)' },
                    { v: 'WEEKLY', l: 'Hebdomadaire' },
                    { v: 'IMMEDIATE', l: 'Immédiat' },
                  ].map(f => (
                    <button
                      key={f.v}
                      type="button"
                      onClick={() => setFormFrequency(f.v)}
                      style={{
                        padding: '6px 14px', fontSize: 12, fontWeight: 500,
                        border: formFrequency === f.v ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                        background: formFrequency === f.v ? '#DBEAFE' : '#fff',
                        color: formFrequency === f.v ? '#2563EB' : '#64748B',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  style={{
                    flex: 1, padding: '10px 0', border: '1px solid #E2E8F0',
                    background: '#fff', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', color: '#64748B',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim() || formKeywords.length === 0}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none',
                    background: '#3B82F6', fontSize: 13, fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    color: '#fff', opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Création...' : 'Créer l\'alerte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : alerts.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          padding: '56px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto',
        }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 20px',
            background: 'var(--indigo-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={28} style={{ color: 'var(--indigo)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Recevez chaque jour les marchés qui vous correspondent
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.6 }}>
            Configurez vos critères de veille et ne ratez plus aucun appel d&apos;offres pertinent.
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, textAlign: 'left' }}>
            {[
              { n: '1', t: 'Choisissez vos critères', d: 'Secteur, département, type de marché' },
              { n: '2', t: 'Recevez par email', d: 'Chaque matin à 8h, les nouvelles consultations' },
              { n: '3', t: 'Ne ratez plus rien', d: 'Répondez avant la clôture' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, padding: '14px', background: 'var(--surface-sub)', border: '1px solid var(--border)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--indigo)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gradient" style={{
            padding: '12px 32px', fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          }}>
            <Plus size={15} /> Créer ma première alerte
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map(a => (
            <div key={a.id} className={`card p-4 px-5 ${a.active ? '' : 'opacity-50'}`}>
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className={a.active ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-sm font-semibold">{a.name}</span>
                    <span className={`px-2.5 py-[2px] rounded text-[10px] font-semibold ${a.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {a.active ? 'Active' : 'Pause'}
                    </span>
                    <span className="px-2.5 py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">
                      {freqLabels[a.frequency] || a.frequency}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.keywords?.map((k: string, j: number) => (
                      <span key={j} className="px-2 py-[2px] rounded text-[10px] font-semibold bg-blue-50 text-blue-600">{k}</span>
                    ))}
                    {a.natures?.map((n: string, j: number) => (
                      <span key={j} className="px-2 py-[2px] rounded text-[10px] font-semibold bg-amber-50 text-amber-600">{n === 'TRAVAUX' ? 'Travaux' : n === 'SERVICES' ? 'Services' : 'Fournitures'}</span>
                    ))}
                    {a.departments?.map((d: string, j: number) => (
                      <span key={j} className="px-2 py-[2px] rounded text-[10px] font-semibold bg-blue-50 text-blue-600">Dép. {d}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleAlert(a.id, a.active)} className="p-1.5 rounded border border-gray-200 bg-white cursor-pointer hover:bg-gray-50" title={a.active ? 'Mettre en pause' : 'Activer'}>
                    {a.active ? <Pause size={12} className="text-gray-400" /> : <Play size={12} className="text-gray-400" />}
                  </button>
                  <button onClick={() => deleteAlert(a.id)} className="p-1.5 rounded border border-gray-200 bg-white cursor-pointer hover:bg-gray-50" title="Supprimer">
                    <Trash2 size={12} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
