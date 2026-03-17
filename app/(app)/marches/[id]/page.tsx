'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Tag,
  Layers,
  Timer,
  ExternalLink,
  Banknote,
  Scale,
  Bell,
  Download,
  CalendarCheck,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  daysUntil,
  getNatureLabel,
  getNatureBadge,
} from '@/lib/utils';

function buildSourceUrl(sourceRef: string | null): string | null {
  if (!sourceRef) return null;
  if (sourceRef.startsWith('BOAMP-')) {
    const idweb = sourceRef.replace('BOAMP-', '');
    if (!idweb) return null;
    return `https://www.boamp.fr/pages/avis/?q=idweb:${idweb}`;
  }
  if (sourceRef.startsWith('TED-')) {
    const pubNumber = sourceRef.replace('TED-', '');
    if (!pubNumber) return null;
    return `https://ted.europa.eu/fr/notice/-/detail/${pubNumber}`;
  }
  if (sourceRef.startsWith('DECP-')) {
    // Les DECP n'ont pas de page individuelle publique, lien vers le dataset
    return `https://data.economie.gouv.fr/explore/dataset/decp_augmente/table/`;
  }
  return null;
}

const TIME_SLOTS = [
  '8h00 - 9h00', '9h00 - 10h00', '10h00 - 11h00', '11h00 - 12h00',
  '13h00 - 14h00', '14h00 - 15h00', '15h00 - 16h00', '16h00 - 17h00', '17h00 - 18h00',
];

export default function MarcheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [marche, setMarche] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // RDV widget state
  const [rdvDate, setRdvDate] = useState('');
  const [rdvSlot, setRdvSlot] = useState('');
  const [rdvMessage, setRdvMessage] = useState('');
  const [rdvLoading, setRdvLoading] = useState(false);
  const [rdvSuccess, setRdvSuccess] = useState(false);
  const [rdvError, setRdvError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/marches/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setMarche)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-20">
        Chargement de la consultation...
      </div>
    );
  }

  if (error || !marche) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 mb-4">Consultation introuvable.</p>
        <Link href="/marches" className="text-blue-600 text-sm font-semibold no-underline">
          ← Retour aux consultations
        </Link>
      </div>
    );
  }

  const dl = daysUntil(marche.deadline);
  const sourceUrl = buildSourceUrl(marche.sourceRef);

  // Minimum date = tomorrow, exclude Sundays
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  async function handleRdvSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRdvError('');
    if (!rdvDate || !rdvSlot) {
      setRdvError('Veuillez sélectionner une date et un créneau.');
      return;
    }
    // Check not Sunday
    const day = new Date(rdvDate).getDay();
    if (day === 0) {
      setRdvError('Les dimanches ne sont pas disponibles. Veuillez choisir un autre jour (lundi à samedi).');
      return;
    }
    setRdvLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: marche.title,
          marketReference: marche.sourceRef || marche.id,
          requestedDate: new Date(rdvDate).toISOString(),
          timeSlot: rdvSlot,
          message: rdvMessage || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la demande.');
      }
      setRdvSuccess(true);
      setRdvDate('');
      setRdvSlot('');
      setRdvMessage('');
    } catch (err: any) {
      setRdvError(err.message || 'Erreur serveur.');
    }
    setRdvLoading(false);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 bg-transparent border-none cursor-pointer font-[inherit] p-0"
      >
        <ArrowLeft size={15} /> Retour aux consultations
      </button>

      {/* Header card */}
      <div className="card p-6 mb-3">
        <div className="flex gap-2 items-center flex-wrap mb-3">
          <span className={getNatureBadge(marche.nature)}>
            {getNatureLabel(marche.nature)}
          </span>
          {marche.procedureType && (
            <span className="px-2 py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">
              {marche.procedureType}
            </span>
          )}
          {marche.status === 'OUVERT' ? (
            <span className="px-2 py-[2px] rounded text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold">
              OUVERT
            </span>
          ) : marche.status === 'ATTRIBUE' ? (
            <span className="px-2 py-[2px] rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              ATTRIBUÉ
            </span>
          ) : (
            <span className="px-2 py-[2px] rounded text-[10px] bg-red-50 text-red-500 border border-red-200 font-semibold">
              FERMÉ
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-mono ml-auto">
            {marche.sourceRef}
          </span>
        </div>

        <h1 className="text-lg font-bold leading-snug mb-4">{marche.title}</h1>

        <div className="flex gap-5 flex-wrap text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Building2 size={15} className="text-gray-400" />
            {marche.buyer}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-400" />
            {marche.departmentName || marche.department} ({marche.department})
            {marche.region && (
              <span className="text-gray-400">· {marche.region}</span>
            )}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Left column — Key info */}
        <div className="col-span-2 card p-6">
          <h2 className="text-sm font-bold mb-4">Informations clés</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Detail
              icon={<Banknote size={15} className="text-gray-400" />}
              label="Montant estimé"
              value={marche.value ? formatCurrency(marche.value) : null}
              placeholder="Non communiqué — consulter le DCE"
              highlight
            />
            <Detail
              icon={<Clock size={15} className="text-gray-400" />}
              label="Date limite de réponse"
              value={
                marche.deadline
                  ? `${formatDate(marche.deadline)}${dl !== null ? ` (${dl > 0 ? `dans ${dl} j` : 'Expiré'})` : ''}`
                  : null
              }
              placeholder="Non communiqué"
              urgent={dl !== null && dl <= 7 && dl > 0}
              expired={dl !== null && dl <= 0}
            />
            <Detail
              icon={<Calendar size={15} className="text-gray-400" />}
              label="Date de publication"
              value={formatDate(marche.publicationDate)}
            />
            <Detail
              icon={<Scale size={15} className="text-gray-400" />}
              label="Procédure"
              value={marche.procedureType || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<Layers size={15} className="text-gray-400" />}
              label="Nombre de lots"
              value={`${marche.lots} lot${marche.lots > 1 ? 's' : ''}`}
            />
            <Detail
              icon={<Timer size={15} className="text-gray-400" />}
              label="Durée du marché"
              value={marche.duration || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<Tag size={15} className="text-gray-400" />}
              label="Code CPV"
              value={marche.cpvCode || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<FileText size={15} className="text-gray-400" />}
              label="Descripteurs"
              value={marche.cpvLabel || null}
              placeholder="Non communiqué"
            />
          </div>
        </div>

        {/* Right column — Actions + Source */}
        <div className="flex flex-col gap-3">
          {/* Actions */}
          <div className="card p-6">
            <h2 className="text-sm font-bold mb-4">Actions</h2>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient !text-xs !w-full !justify-center !py-2.5 !gap-2 no-underline mb-2.5"
              >
                <ExternalLink size={14} />
                Voir l&apos;annonce originale
              </a>
            ) : (
              <div className="text-[11px] text-gray-400 italic text-center mb-2.5 py-2">
                Annonce non disponible en ligne
              </div>
            )}
            <div className="text-[11px] text-gray-400 italic text-center mb-2.5 py-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px' }}>
              <Download size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              DCE disponible sur la plateforme de l&apos;acheteur
            </div>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (marche.nature) params.set('nature', marche.nature);
                if (marche.department) params.set('department', marche.department);
                router.push(`/alertes?${params.toString()}`);
              }}
              className="btn-secondary !text-xs !w-full !justify-center !py-2.5 !gap-2"
            >
              <Bell size={14} />
              Créer une alerte similaire
            </button>
          </div>

          {/* Source info */}
          <div className="card p-6">
            <h2 className="text-sm font-bold mb-3">Source</h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Plateforme</span>
                <span className="font-semibold">{marche.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Référence</span>
                <span className="font-mono text-[11px]">{marche.sourceRef}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Indexé le</span>
                <span>{formatDate(marche.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RDV Widget ── */}
      {session && (
        <div className="card p-6 mt-3">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={20} color="#fff" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Demander un rendez-vous</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Accompagnement personnalisé pour ce marché</p>
            </div>
          </div>

          {rdvSuccess ? (
            <div style={{ padding: '24px 20px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Demande envoyée avec succès !</p>
              <p style={{ fontSize: 13, color: '#047857' }}>Nous vous recontacterons très rapidement pour confirmer le créneau.</p>
              <button
                onClick={() => setRdvSuccess(false)}
                style={{ marginTop: 14, padding: '8px 20px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Faire une autre demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleRdvSubmit}>
              {/* Pre-filled subject */}
              <div className="mb-4">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Objet du marché</label>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>
                  {marche.title}
                </div>
              </div>

              {/* Date + Time slot row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="rdv-grid">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Date souhaitée <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={rdvDate}
                    onChange={(e) => setRdvDate(e.target.value)}
                    min={minDate}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Du lundi au samedi uniquement</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Créneau horaire <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={rdvSlot}
                    onChange={(e) => setRdvSlot(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box', appearance: 'auto' as any }}
                  >
                    <option value="">Sélectionnez un créneau</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="mt-4">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message (optionnel)</label>
                <textarea
                  value={rdvMessage}
                  onChange={(e) => setRdvMessage(e.target.value)}
                  placeholder="Précisez vos besoins ou questions..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {rdvError && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
                  {rdvError}
                </div>
              )}

              <button
                type="submit"
                disabled={rdvLoading}
                style={{
                  marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 8,
                  border: 'none', background: 'linear-gradient(135deg, #059669, #10B981)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: rdvLoading ? 'not-allowed' : 'pointer',
                  opacity: rdvLoading ? 0.6 : 1, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Send size={15} />
                {rdvLoading ? 'Envoi en cours...' : 'Demander un rendez-vous'}
              </button>
            </form>
          )}

          {/* Responsive */}
          <style jsx>{`
            @media (max-width: 640px) {
              .rdv-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  placeholder,
  highlight,
  urgent,
  expired,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder?: string;
  highlight?: boolean;
  urgent?: boolean;
  expired?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
        {value ? (
          <div
            className={`text-sm font-semibold ${
              expired
                ? 'text-red-500'
                : urgent
                  ? 'text-amber-600'
                  : highlight
                    ? 'text-gray-900'
                    : 'text-gray-700'
            }`}
          >
            {value}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">
            {placeholder || 'Non communiqué'}
          </div>
        )}
      </div>
    </div>
  );
}
