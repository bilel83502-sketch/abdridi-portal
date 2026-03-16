'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, Hourglass, CircleDot, Search, RefreshCw, Send, X } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING: { label: 'En attente', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  CONFIRMED: { label: 'Confirmé', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  DONE: { label: 'Terminé', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
};

function formatDateFr(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function RendezVousPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Relance modal state
  const [relanceAptId, setRelanceAptId] = useState<string | null>(null);
  const [relanceNote, setRelanceNote] = useState('');
  const [relanceSaving, setRelanceSaving] = useState(false);

  function fetchAppointments() {
    setLoading(true);
    fetch('/api/appointments')
      .then(r => r.json())
      .then(data => setAppointments(data.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated') fetchAppointments();
  }, [sessionStatus]);

  async function handleRelance(e: React.FormEvent) {
    e.preventDefault();
    if (!relanceAptId || !relanceNote.trim()) return;
    setRelanceSaving(true);
    try {
      const res = await fetch('/api/appointments/relance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: relanceAptId, note: relanceNote.trim() }),
      });
      if (res.ok) {
        const { relance } = await res.json();
        // Update local state
        setAppointments(prev => prev.map(a => {
          if (a.id === relanceAptId) {
            return { ...a, relances: [relance, ...(a.relances || [])] };
          }
          return a;
        }));
        setRelanceAptId(null);
        setRelanceNote('');
      }
    } catch (err) {
      console.error(err);
    }
    setRelanceSaving(false);
  }

  if (sessionStatus === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes rendez-vous</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Suivi de vos demandes d&apos;accompagnement</p>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-5" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #A7F3D0' }}>
        <p style={{ fontSize: 13, color: '#065F46', lineHeight: 1.5, margin: 0 }}>
          Demandez un rendez-vous depuis n&apos;importe quelle page de détail d&apos;une consultation.
          Nos experts vous accompagnent de A à Z dans le montage de votre dossier.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }} className="rdv-stats-grid">
        <div className="card p-4" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>
            {appointments.filter(a => a.status === 'PENDING').length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>En attente</div>
        </div>
        <div className="card p-4" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>
            {appointments.filter(a => a.status === 'CONFIRMED').length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Confirmés</div>
        </div>
        <div className="card p-4" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>
            {appointments.filter(a => a.status === 'DONE').length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Terminés</div>
        </div>
      </div>

      {/* Relance modal */}
      {relanceAptId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} onClick={() => setRelanceAptId(null)} />
          <div style={{ position: 'relative', width: 440, maxWidth: '90vw', background: '#fff', padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Relancer ce rendez-vous</h2>
              <button onClick={() => setRelanceAptId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRelance}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Note de relance <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  value={relanceNote}
                  onChange={e => setRelanceNote(e.target.value)}
                  placeholder="Précisez le motif de la relance..."
                  rows={3}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                    fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date de relance</label>
                <div style={{ fontSize: 13, color: '#64748B', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {formatDateFr(new Date().toISOString())}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRelanceAptId(null)}
                  style={{ flex: 1, padding: '10px 0', border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#64748B' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={relanceSaving || !relanceNote.trim()}
                  style={{ flex: 1, padding: '10px 0', border: 'none', background: '#3B82F6', fontSize: 13, fontWeight: 600, cursor: relanceSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: relanceSaving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Send size={13} />
                  {relanceSaving ? 'Envoi...' : 'Enregistrer la relance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments list */}
      {loading ? (
        <div className="card p-16 text-center text-gray-400">Chargement des rendez-vous...</div>
      ) : appointments.length === 0 ? (
        <div className="card p-16 text-center">
          <div style={{ width: 56, height: 56, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar size={24} style={{ color: '#9CA3AF' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucun rendez-vous</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
            Vous n&apos;avez pas encore demandé de rendez-vous.
          </p>
          <Link
            href="/marches"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            <Search size={14} />
            Parcourir les consultations
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointments.map((apt) => {
            const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
            const latestRelance = apt.relances?.[0];
            return (
              <div key={apt.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {apt.status === 'PENDING' && <Hourglass size={11} />}
                        {apt.status === 'CONFIRMED' && <CheckCircle2 size={11} />}
                        {apt.status === 'DONE' && <CircleDot size={11} />}
                        {sc.label}
                      </span>
                      {latestRelance && (
                        <span style={{
                          padding: '3px 8px', fontSize: 10, fontWeight: 600,
                          background: '#DBEAFE', color: '#2563EB',
                        }}>
                          Relancé le {formatDateFr(latestRelance.date)}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.3, margin: '0 0 4px' }}>
                      {apt.subject}
                    </h3>
                    {apt.marketReference && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginBottom: 4 }}>{apt.marketReference}</div>
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} style={{ color: '#9CA3AF' }} /> {formatDateFr(apt.requestedDate)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} style={{ color: '#9CA3AF' }} /> {apt.timeSlot}
                      </span>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>
                        Demandé le {formatDateFr(apt.createdAt)}
                      </span>
                    </div>

                    {/* Relance history */}
                    {apt.relances && apt.relances.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Historique des relances</div>
                        {apt.relances.map((r: any) => (
                          <div key={r.id} style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>
                            <span style={{ color: '#94A3B8' }}>{formatDateFr(r.date)}</span> — {r.note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => { setRelanceAptId(apt.id); setRelanceNote(''); }}
                      style={{
                        padding: '8px 16px', background: 'rgba(59,130,246,0.1)',
                        color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)',
                        fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Send size={12} /> Relancer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .rdv-stats-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
