'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import FocusTrap from 'focus-trap-react';
import { useModalKeyboard } from '@/hooks/useModalKeyboard';
import { Calendar, Clock, CheckCircle2, Hourglass, CircleDot, RefreshCw, Send, X, Phone, Shield } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING: { label: 'En attente', bg: 'rgba(0,194,255,0.08)', color: '#00C2FF', border: 'rgba(0,194,255,0.2)' },
  CONFIRMED: { label: 'Confirme', bg: 'rgba(0,194,255,0.15)', color: '#00C2FF', border: 'rgba(0,194,255,0.3)' },
  DONE: { label: 'Termine', bg: 'rgba(148,163,184,0.1)', color: '#94A3B8', border: '#334155' },
};

const SECTORS = [
  { value: '', label: 'Selectionnez votre secteur' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Logistique', label: 'Logistique' },
  { value: 'Dechets', label: 'Dechets / Proprete' },
  { value: 'BTP', label: 'BTP / Construction' },
  { value: 'Informatique', label: 'Informatique / Numerique' },
  { value: 'Services', label: 'Services aux entreprises' },
  { value: 'Autre', label: 'Autre' },
];

const TIME_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
];

function formatDateFr(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function getMinDate() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px', borderRadius: 8,
  border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export default function RendezVousPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTimeSlot, setFormTimeSlot] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [relanceAptId, setRelanceAptId] = useState<string | null>(null);
  const closeRelance = useCallback(() => { setRelanceAptId(null); setRelanceNote(''); }, []);
  useModalKeyboard({ isOpen: !!relanceAptId, onClose: closeRelance });
  const [relanceNote, setRelanceNote] = useState('');
  const [relanceSaving, setRelanceSaving] = useState(false);

  function fetchAppointments() {
    setLoading(true);
    fetch('/api/appointments').then(r => r.json()).then(data => setAppointments(data.appointments || [])).catch(() => setAppointments([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchAppointments();
      if (session?.user) { setFormName(session.user.name || ''); setFormEmail(session.user.email || ''); }
    }
  }, [sessionStatus, session]);

  useEffect(() => { document.title = 'Rendez-vous | AB DRIDI'; }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formDate || !formTimeSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `RDV ${formSector || 'Accompagnement'} — ${formName}`,
          requestedDate: formDate, timeSlot: formTimeSlot,
          message: [formPhone ? `Tel: ${formPhone}` : '', formSector ? `Secteur: ${formSector}` : '', formMessage || ''].filter(Boolean).join('\n'),
        }),
      });
      if (res.ok) { setSubmitted(true); setFormPhone(''); setFormSector(''); setFormDate(''); setFormTimeSlot(''); setFormMessage(''); fetchAppointments(); }
    } catch {}
    setSubmitting(false);
  }

  async function handleRelance(e: React.FormEvent) {
    e.preventDefault();
    if (!relanceAptId || !relanceNote.trim()) return;
    setRelanceSaving(true);
    try {
      const res = await fetch('/api/appointments/relance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointmentId: relanceAptId, note: relanceNote.trim() }) });
      if (res.ok) { const { relance } = await res.json(); setAppointments(prev => prev.map(a => a.id === relanceAptId ? { ...a, relances: [relance, ...(a.relances || [])] } : a)); setRelanceAptId(null); setRelanceNote(''); }
    } catch {}
    setRelanceSaving(false);
  }

  if (sessionStatus === 'loading') return <div style={{ textAlign: 'center', color: '#64748B', padding: '64px 0' }}>Chargement...</div>;

  return (
    <div style={{ background: '#0A1628', margin: '-20px -16px -28px', padding: '24px 24px 32px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ═══ HERO ═══ */}
        <div style={{ background: '#0F172A', borderRadius: 12, border: '1px solid #1E293B', padding: '40px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,194,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', gap: 40, position: 'relative' }}>
            {/* Left 60% */}
            <div style={{ flex: 3, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', marginBottom: 16,
                background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)', borderRadius: 20,
              }}>
                <Phone size={11} style={{ color: '#00C2FF' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#00C2FF', letterSpacing: '0.08em' }}>ACCOMPAGNEMENT GRATUIT</span>
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 12px' }}>
                Un expert marches publics vous accompagne
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480 }}>
                Prenez rendez-vous gratuitement pour discuter de vos opportunites dans les marches publics.
                Nous analysons votre eligibilite et vous proposons les appels d&apos;offres adaptes a votre entreprise.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <CheckCircle2 size={15} />, text: 'Analyse gratuite de votre profil' },
                  { icon: <CheckCircle2 size={15} />, text: 'Selection d\'appels d\'offres sur-mesure' },
                  { icon: <CheckCircle2 size={15} />, text: 'Montage complet du dossier de reponse' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#00C2FF', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 40% — Form */}
            <div style={{
              flex: 2, flexShrink: 0, background: '#1E293B', borderRadius: 12,
              border: '1px solid #334155', padding: '24px 24px 20px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '28px 8px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px', background: 'rgba(0,194,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} style={{ color: '#00C2FF' }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Demande envoyee !</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 18px' }}>Notre equipe vous contactera sous 24h pour confirmer votre creneau.</p>
                  <button onClick={() => setSubmitted(false)} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#00C2FF', border: '1px solid rgba(0,194,255,0.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Prendre un autre RDV
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Demander un creneau</h3>

                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="rdv-name" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Nom complet *</label>
                    <input id="rdv-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nom complet" required style={{ ...fieldStyle, color: '#94A3B8' }} readOnly={!!session?.user?.name} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="rdv-email" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Email *</label>
                    <input id="rdv-email" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email" required style={{ ...fieldStyle, color: '#94A3B8' }} readOnly={!!session?.user?.email} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="rdv-phone" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Telephone</label>
                    <input id="rdv-phone" type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Telephone" style={fieldStyle} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="rdv-sector" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Secteur d&apos;activite</label>
                    <select id="rdv-sector" value={formSector} onChange={e => setFormSector(e.target.value)} style={{ ...fieldStyle, color: formSector ? '#E2E8F0' : '#64748B' }}>
                      {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="rdv-date" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Date *</label>
                      <input id="rdv-date" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} min={getMinDate()} required style={fieldStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="rdv-time" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Creneau *</label>
                      <select id="rdv-time" value={formTimeSlot} onChange={e => setFormTimeSlot(e.target.value)} required style={{ ...fieldStyle, color: formTimeSlot ? '#E2E8F0' : '#64748B' }}>
                        <option value="">Choisir un creneau</option>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="rdv-message" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Message (optionnel)</label>
                    <textarea id="rdv-message" value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Decrivez votre besoin..." rows={2} style={{ ...fieldStyle, height: 'auto', resize: 'vertical', padding: '10px 14px' }} />
                  </div>

                  <button type="submit" disabled={submitting || !formDate || !formTimeSlot} style={{
                    width: '100%', padding: '12px 0', border: 'none', borderRadius: 8,
                    background: submitting ? '#334155' : '#00C2FF', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Calendar size={15} />
                    {submitting ? 'Envoi...' : 'Demander un rendez-vous'}
                  </button>

                  <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 1.4 }}>
                    Gratuit et sans engagement. Reponse sous 24h.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    <Shield size={11} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Vos donnees restent confidentielles</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ═══ EXISTING APPOINTMENTS ═══ */}
        {appointments.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Mes rendez-vous ({appointments.length})</h2>
              <button onClick={fetchAppointments} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid #334155', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}>
                <RefreshCw size={12} /> Actualiser
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'En attente', count: appointments.filter(a => a.status === 'PENDING').length, color: '#00C2FF' },
                { label: 'Confirmes', count: appointments.filter(a => a.status === 'CONFIRMED').length, color: '#00C2FF' },
                { label: 'Termines', count: appointments.filter(a => a.status === 'DONE').length, color: '#64748B' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, padding: '10px 14px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {appointments.map((apt) => {
                const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                const latestRelance = apt.relances?.[0];
                return (
                  <div key={apt.id} style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {apt.status === 'PENDING' && <Hourglass size={11} />}
                            {apt.status === 'CONFIRMED' && <CheckCircle2 size={11} />}
                            {apt.status === 'DONE' && <CircleDot size={11} />}
                            {sc.label}
                          </span>
                          {latestRelance && (
                            <span style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, background: 'rgba(0,194,255,0.08)', color: '#00C2FF' }}>
                              Relance le {formatDateFr(latestRelance.date)}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', lineHeight: 1.3, margin: '0 0 4px' }}>{apt.subject}</h3>
                        {apt.marketReference && <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 4 }}>{apt.marketReference}</div>}
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94A3B8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} style={{ color: '#64748B' }} /> {formatDateFr(apt.requestedDate)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} style={{ color: '#64748B' }} /> {apt.timeSlot}</span>
                          <span style={{ fontSize: 11, color: '#334155' }}>Demande le {formatDateFr(apt.createdAt)}</span>
                        </div>
                        {apt.relances && apt.relances.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1E293B' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Historique des relances</div>
                            {apt.relances.map((r: any) => (
                              <div key={r.id} style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}><span style={{ color: '#64748B' }}>{formatDateFr(r.date)}</span> — {r.note}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => { setRelanceAptId(apt.id); setRelanceNote(''); }} style={{ padding: '8px 16px', background: 'rgba(0,194,255,0.08)', color: '#00C2FF', border: '1px solid rgba(0,194,255,0.2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}>
                          <Send size={12} /> Relancer
                        </button>
                        {apt.status === 'PENDING' && (
                          <button onClick={async () => { if (!confirm('Annuler ce rendez-vous ?')) return; await fetch('/api/appointments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: apt.id }) }); fetchAppointments(); }} style={{ padding: '8px 16px', background: 'rgba(148,163,184,0.08)', color: '#94A3B8', border: '1px solid #334155', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}>
                            <X size={12} /> Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Relance modal */}
        {relanceAptId && (
          <FocusTrap>
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="relance-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.8)' }} onClick={() => setRelanceAptId(null)} />
            <div className="modal-content" style={{ position: 'relative', width: 440, maxWidth: '90vw', background: '#1E293B', border: '1px solid #334155', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 id="relance-modal-title" style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Relancer ce rendez-vous</h2>
                <button onClick={() => setRelanceAptId(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleRelance}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Note de relance *</label>
                  <textarea value={relanceNote} onChange={e => setRelanceNote(e.target.value)} placeholder="Precisez le motif de la relance..." rows={3} required style={{ ...fieldStyle, height: 'auto', resize: 'vertical', padding: '10px 14px' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setRelanceAptId(null)} style={{ flex: 1, padding: '10px 0', border: '1px solid #334155', background: 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#94A3B8', borderRadius: 6 }}>Annuler</button>
                  <button type="submit" disabled={relanceSaving || !relanceNote.trim()} style={{ flex: 1, padding: '10px 0', border: 'none', background: '#00C2FF', fontSize: 13, fontWeight: 600, cursor: relanceSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: relanceSaving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 6 }}>
                    <Send size={13} /> {relanceSaving ? 'Envoi...' : 'Enregistrer la relance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </FocusTrap>
        )}

      </div>
    </div>
  );
}
