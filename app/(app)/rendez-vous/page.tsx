'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TIME_SLOTS = [
  '9h-10h',
  '10h-11h',
  '11h-12h',
  '14h-15h',
  '15h-16h',
  '16h-17h',
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'En attente', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  CONFIRMED: { label: 'Confirm\u00e9', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  DONE: { label: 'Termin\u00e9', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
};

export default function RendezVousPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  const isPaid = user?.plan === 'VEILLE' || user?.role === 'ADMIN';

  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingAppts(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if (!isPaid) {
        router.push('/abonnement');
      } else {
        loadAppointments();
      }
    }
  }, [sessionStatus, isPaid, router, loadAppointments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!subject.trim() || !date || !timeSlot) {
      setError('Veuillez remplir les champs obligatoires (objet, date, cr\u00e9neau).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, reference, date, timeSlot, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la demande.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubject('');
      setReference('');
      setDate('');
      setTimeSlot('');
      setMessage('');
      loadAppointments();
    } catch (e) {
      setError('Erreur r\u00e9seau.');
    }
    setSubmitting(false);
  }

  if (sessionStatus === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  if (!isPaid) return null;

  // Compute min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'DONE');
  const pastAppts = appointments.filter(a => new Date(a.date) < new Date() || a.status === 'DONE');

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prendre rendez-vous</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Accompagnement montage de dossier</p>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="card mb-5" style={{ padding: '14px 18px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#065F46' }}>
            Votre demande de rendez-vous a bien &eacute;t&eacute; envoy&eacute;e. Nous vous recontacterons pour confirmer le cr&eacute;neau.
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="card mb-5" style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#991B1B' }}>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="card p-6 mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Nouvelle demande de rendez-vous</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Subject */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Objet du march&eacute; <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: March\u00e9 de fournitures informatiques"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', background: '#fff',
                }}
              />
            </div>

            {/* Reference */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                R&eacute;f&eacute;rence du march&eacute; <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: BOAMP-23-xxxxx"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', background: '#fff',
                }}
              />
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Date souhait&eacute;e <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', background: '#fff',
                }}
              />
            </div>

            {/* Time slot */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Cr&eacute;neau horaire <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      fontFamily: 'inherit', cursor: 'pointer',
                      border: timeSlot === slot ? '2px solid #059669' : '1px solid #E5E7EB',
                      background: timeSlot === slot ? '#ECFDF5' : '#fff',
                      color: timeSlot === slot ? '#059669' : '#374151',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Clock size={13} />
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Message / pr&eacute;cisions <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="D&eacute;crivez votre besoin, les pi&egrave;ces dont vous disposez, etc."
                rows={4}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', background: '#fff', resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 8, border: 'none',
                background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {submitting ? (
                <><Loader2 size={16} className="login-spinner" /> Envoi en cours...</>
              ) : (
                <><Send size={16} /> Demander un rendez-vous</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Appointments list */}
      {loadingAppts ? (
        <div className="text-center text-gray-400 py-8">Chargement des rendez-vous...</div>
      ) : appointments.length > 0 && (
        <>
          {/* Upcoming */}
          {upcomingAppts.length > 0 && (
            <div className="card overflow-hidden mb-5">
              <div className="p-3.5 px-5 border-b border-gray-100">
                <span className="text-[13px] font-semibold">&Agrave; venir ({upcomingAppts.length})</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="w-full" style={{ minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {['Objet', 'R\u00e9f\u00e9rence', 'Date', 'Cr\u00e9neau', 'Statut'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppts.map((a: any) => {
                      const st = STATUS_LABELS[a.status] || STATUS_LABELS.PENDING;
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, maxWidth: 250 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.subject}</div>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#6B7280' }}>{a.reference || '\u2014'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>
                            {new Date(a.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>{a.timeSlot}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                              color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                            }}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past */}
          {pastAppts.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-3.5 px-5 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-400">Pass&eacute;s ({pastAppts.length})</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="w-full" style={{ minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {['Objet', 'R\u00e9f\u00e9rence', 'Date', 'Cr\u00e9neau', 'Statut'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppts.map((a: any) => {
                      const st = STATUS_LABELS[a.status] || STATUS_LABELS.PENDING;
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, maxWidth: 250, color: '#9CA3AF' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.subject}</div>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#9CA3AF' }}>{a.reference || '\u2014'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#9CA3AF' }}>
                            {new Date(a.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 13, color: '#9CA3AF' }}>{a.timeSlot}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                              color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                            }}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Responsive override */}
      <style jsx>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
