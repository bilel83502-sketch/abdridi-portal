'use client';

import { useEffect, useState } from 'react';
import { Mail, Plus, Pause, Play, Trash2 } from 'lucide-react';

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const freqLabels: Record<string, string> = { DAILY: 'Quotidien', IMMEDIATE: 'Immédiat', WEEKLY: 'Hebdo' };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold">Alertes email</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Recevez les nouvelles consultations selon vos critères de veille.</p>
        </div>
        <button className="btn-gradient"><Plus size={15} /> Créer une alerte</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : alerts.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
          padding: '56px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
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
          {/* 3 steps */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, textAlign: 'left' }}>
            {[
              { n: '1', t: 'Choisissez vos critères', d: 'Secteur, département, type de marché' },
              { n: '2', t: 'Recevez par email', d: 'Chaque matin à 8h, les nouvelles consultations' },
              { n: '3', t: 'Ne ratez plus rien', d: 'Répondez avant la clôture' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, padding: '14px', borderRadius: 10, background: 'var(--surface-sub)', border: '1px solid var(--border)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--indigo)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <button className="btn-gradient" style={{
            padding: '12px 32px', fontSize: 14, fontWeight: 600, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
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
                      <span key={j} className="px-2 py-[2px] rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600">Dép. {d}</span>
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
