'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Clock, FileText, CheckCircle2, Hourglass, CircleDot, Search, RefreshCw } from 'lucide-react';

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

  if (sessionStatus === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes rendez-vous</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Suivi de vos demandes d&apos;accompagnement</p>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-5" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #A7F3D0' }}>
        <p style={{ fontSize: 13, color: '#065F46', lineHeight: 1.5, margin: 0 }}>
          Demandez un rendez-vous depuis n&apos;importe quelle page de d&eacute;tail d&apos;une consultation.
          Nos experts vous accompagnent de A &agrave; Z dans le montage de votre dossier.
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

      {/* Appointments list */}
      {loading ? (
        <div className="card p-16 text-center text-gray-400">Chargement des rendez-vous...</div>
      ) : appointments.length === 0 ? (
        <div className="card p-16 text-center">
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar size={24} style={{ color: '#9CA3AF' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucun rendez-vous</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
            Vous n&apos;avez pas encore demand&eacute; de rendez-vous.
          </p>
          <Link
            href="/marches"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            <Search size={14} />
            Parcourir les consultations
          </Link>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Desktop table */}
          <div className="rdv-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Objet</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Créneau</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demandé le</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                  return (
                    <tr key={apt.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px', maxWidth: 320 }}>
                        <div style={{ fontWeight: 600, color: '#111827', lineHeight: 1.3, marginBottom: 2 }} className="line-clamp-2">
                          {apt.subject}
                        </div>
                        {apt.marketReference && (
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{apt.marketReference}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                          <Calendar size={13} style={{ color: '#9CA3AF' }} />
                          {formatDateFr(apt.requestedDate)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                          <Clock size={13} style={{ color: '#9CA3AF' }} />
                          {apt.timeSlot}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 6,
                          fontSize: 11, fontWeight: 600,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        }}>
                          {apt.status === 'PENDING' && <Hourglass size={11} />}
                          {apt.status === 'CONFIRMED' && <CheckCircle2 size={11} />}
                          {apt.status === 'DONE' && <CircleDot size={11} />}
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {formatDateFr(apt.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards (hidden on desktop) */}
          <div className="rdv-mobile-cards">
            {appointments.map((apt) => {
              const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={apt.id} style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 13, lineHeight: 1.3, flex: 1 }}>
                      {apt.subject}
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6,
                      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    }}>
                      {sc.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {formatDateFr(apt.requestedDate)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {apt.timeSlot}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Responsive */}
      <style jsx>{`
        .rdv-table-wrapper { display: block; }
        .rdv-mobile-cards { display: none; }
        @media (max-width: 768px) {
          .rdv-stats-grid { grid-template-columns: 1fr 1fr 1fr !important; }
          .rdv-table-wrapper { display: none !important; }
          .rdv-mobile-cards { display: block !important; }
        }
      `}</style>
    </div>
  );
}
