'use client';

import { useSession } from 'next-auth/react';
import { Calendar, FileText, Target, Bell, Mail } from 'lucide-react';

export default function RendezVousPage() {
  const { data: session, status: sessionStatus } = useSession();

  if (sessionStatus === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prendre rendez-vous</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Accompagnement &amp; Strat&eacute;gie</p>
        </div>
      </div>

      {/* Subtitle */}
      <div className="card p-5 mb-6" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #A7F3D0' }}>
        <p style={{ fontSize: 14, color: '#065F46', lineHeight: 1.6, margin: 0 }}>
          R&eacute;servez un cr&eacute;neau pour un accompagnement personnalis&eacute; sur le montage de votre dossier de A &agrave; Z.
          Nos experts vous guident &agrave; chaque &eacute;tape de votre r&eacute;ponse aux appels d&apos;offres.
        </p>
      </div>

      {/* Google Calendar iframe */}
      <div className="card mb-6" style={{ overflow: 'hidden', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} style={{ color: '#059669' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>S&eacute;lectionnez un cr&eacute;neau</span>
        </div>
        <iframe
          src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0"
          style={{
            width: '100%',
            minHeight: 600,
            border: 'none',
            display: 'block',
          }}
          title="Calendrier de prise de rendez-vous AB DRIDI"
        />
      </div>

      {/* Services section */}
      <div className="mb-6">
        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Nos services d&apos;accompagnement</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="services-grid">
          {/* Card 1 */}
          <div className="card p-5" style={{ borderTop: '3px solid #2563EB' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <FileText size={18} style={{ color: '#2563EB' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Montage de dossier</h3>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
              Nous vous accompagnons de A &agrave; Z dans la constitution de votre dossier de r&eacute;ponse aux appels d&apos;offres publics.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card p-5" style={{ borderTop: '3px solid #059669' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Target size={18} style={{ color: '#059669' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Strat&eacute;gie de r&eacute;ponse</h3>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
              Analyse de vos chances et optimisation de votre offre pour maximiser vos taux de r&eacute;ussite.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card p-5" style={{ borderTop: '3px solid #7C3AED' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Bell size={18} style={{ color: '#7C3AED' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Veille personnalis&eacute;e</h3>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
              Configuration d&apos;alertes sur-mesure selon votre activit&eacute; et vos domaines de comp&eacute;tence.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card p-5" style={{ textAlign: 'center', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, color: '#6B7280' }}>
          <Mail size={16} style={{ color: '#2563EB' }} />
          <span>Des questions ? Contactez-nous &agrave; </span>
          <a href="mailto:contact@abdridi.com" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
            contact@abdridi.com
          </a>
        </div>
      </div>

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .services-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
