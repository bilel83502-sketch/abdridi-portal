'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
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
  Star,
  ChevronDown,
  ChevronRight,
  File,
  FileSpreadsheet,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  daysUntil,
  getNatureLabel,
  getNatureBadge,
  cleanTitle,
  decodeHtml,
} from '@/lib/utils';
import { getRegionLogo, normalizeDept } from '@/lib/regions';
import dynamic from 'next/dynamic';

const DepartmentMap = dynamic(() => import('@/components/DepartmentMap'), { ssr: false });
import { canResolveLocation } from '@/components/DepartmentMap';

function buildSourceUrl(sourceRef: string | null, source?: string | null): { url: string; direct: boolean } | null {
  const homepages: Record<string, string> = {
    'BOAMP': 'https://www.boamp.fr',
    'TED': 'https://ted.europa.eu/fr/',
    'SIMAP': 'https://www.simap.ch/fr',
    'DECP': 'https://data.economie.gouv.fr/explore/dataset/decp_augmente/table/',
    'PLACE': 'https://www.marches-publics.gouv.fr',
    'MARCHES-SECURISES': 'https://www.marches-securises.fr',
    'ACHATPUBLIC': 'https://www.achatpublic.com',
    'MEGALIS': 'https://marches.megalisbretagne.org',
    'MAXIMILIEN': 'https://www.maximilien.fr',
    'KLEKOON': 'https://www.klekoon.com',
    'E-MARCHESPUBLICS': 'https://www.e-marchespublics.com',
    'AWS-ACHAT': 'https://www.marches-publics.info',
    'MARCHES-ONLINE': 'https://www.marchesonline.com',
    'XMARCHES': 'https://www.xmarches.fr',
    'MARCHES-DEMAT': 'https://www.marches-demat.com',
    'SAFETENDER': 'https://www.safetender.com',
    'SYNAPSE': 'https://www.synapse-entreprises.com',
    'INTENDRE': 'https://www.intfrancais.com',
    'AJI': 'https://www.achatpublic.com',
    'APPROCH': 'https://www.approch.com',
  };

  if (!sourceRef) {
    // Pas de référence : au moins rediriger vers la plateforme source
    const src = source?.toUpperCase() || '';
    const hp = homepages[src];
    return hp ? { url: hp, direct: false } : null;
  }

  if (sourceRef.startsWith('BOAMP-')) {
    const idweb = sourceRef.replace('BOAMP-', '');
    if (!idweb) return { url: homepages['BOAMP'], direct: false };
    return { url: `https://www.boamp.fr/pages/avis/?q=idweb:${idweb}`, direct: true };
  }
  if (sourceRef.startsWith('TED-')) {
    const pubNumber = sourceRef.replace('TED-', '');
    if (!pubNumber) return { url: homepages['TED'], direct: false };
    return { url: `https://ted.europa.eu/fr/notice/-/detail/${pubNumber}`, direct: true };
  }
  if (sourceRef.startsWith('SIMAP-')) {
    return { url: homepages['SIMAP'], direct: false };
  }
  if (sourceRef.startsWith('DECP-')) {
    return { url: homepages['DECP'], direct: false };
  }
  if (sourceRef.startsWith('PLACE-')) {
    const ref = sourceRef.replace('PLACE-', '');
    if (!ref) return { url: homepages['PLACE'], direct: false };
    return { url: `https://www.marches-publics.gouv.fr/?page=entreprise.EntrepriseDetailConsultation&reference=${ref}`, direct: true };
  }
  if (sourceRef.startsWith('MSEC-')) {
    const ref = sourceRef.replace('MSEC-', '');
    if (!ref) return { url: homepages['MARCHES-SECURISES'], direct: false };
    return { url: `https://www.marches-securises.fr/entreprise/?page=entreprise.EntrepriseDetailConsultation&login_marche=${ref}`, direct: true };
  }
  if (sourceRef.startsWith('ACHATPUBLIC-')) {
    const ref = sourceRef.replace('ACHATPUBLIC-', '');
    if (!ref) return { url: homepages['ACHATPUBLIC'], direct: false };
    return { url: `https://www.achatpublic.com/sdm/ent/gen/ent_detail.do?PCSLID=${ref}`, direct: true };
  }
  if (sourceRef.startsWith('MEGALIS-')) {
    return { url: homepages['MEGALIS'], direct: false };
  }
  if (sourceRef.startsWith('MAXIMILIEN-')) {
    const ref = sourceRef.replace('MAXIMILIEN-', '');
    if (!ref) return { url: homepages['MAXIMILIEN'], direct: false };
    return { url: `https://www.maximilien.fr/gestion/index.php?page=entreprise.EntrepriseDetailConsultation&reference=${ref}`, direct: true };
  }
  if (sourceRef.startsWith('KLEKOON-')) {
    return { url: homepages['KLEKOON'], direct: false };
  }
  if (sourceRef.startsWith('EMP-')) {
    return { url: homepages['E-MARCHESPUBLICS'], direct: false };
  }
  if (sourceRef.startsWith('AWS-')) {
    const id = sourceRef.replace('AWS-', '');
    if (!id) return { url: 'https://www.marches-publics.info', direct: false };
    return { url: `https://www.marches-publics.info/Annonces/MPI-pub-${id}.htm`, direct: true };
  }
  if (sourceRef.startsWith('MO-')) {
    const id = sourceRef.replace('MO-', '');
    if (!id) return { url: 'https://www.marchesonline.com', direct: false };
    return { url: `https://www.marchesonline.com/appels-offres/avis/ao-${id}-1`, direct: true };
  }
  if (sourceRef.startsWith('XMARCHES-')) {
    const key = sourceRef.replace('XMARCHES-', '');
    if (!key) return { url: homepages['XMARCHES'], direct: false };
    return { url: `https://www.xmarches.fr/entreprise/detailConsultation.php?key=${key}`, direct: true };
  }

  // Fallback source homepage
  const src = source?.toUpperCase() || '';
  const hp = homepages[src];
  return hp ? { url: hp, direct: false } : null;
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
  const [isFav, setIsFav] = useState(false);

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

  useEffect(() => {
    if (!params.id) return;
    fetch('/api/favoris').then(r => r.ok ? r.json() : { ids: [] }).then(d => {
      setIsFav(d.ids?.includes(params.id));
    });
  }, [params.id]);

  const toggleFav = async () => {
    const res = await fetch('/api/favoris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marcheId: params.id }) });
    if (res.ok) { const { favorited } = await res.json(); setIsFav(favorited); }
  };

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
  const sourceInfo = buildSourceUrl(marche.sourceRef, marche.source);

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
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 bg-transparent border-none cursor-pointer font-[inherit] p-0"
      >
        <ArrowLeft size={15} /> Retour aux consultations
      </button>

      {/* Header card */}
      <div className="card p-5 mb-2">
        <div className="flex gap-2 items-center flex-wrap mb-2">
          <span className={getNatureBadge(marche.nature)}>
            {getNatureLabel(marche.nature)}
          </span>
          {marche.procedureType && (
            <span className="px-2 py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">
              {marche.procedureType}
            </span>
          )}
          {marche.status === 'OUVERT' ? (
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(0,194,255,0.08)', color: '#00A8DD', border: '1px solid rgba(0,194,255,0.2)' }}>
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
        </div>

        <h1 className="text-lg font-bold leading-snug mb-2">{cleanTitle(marche.title)}</h1>

        <div className="flex gap-5 flex-wrap text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Building2 size={15} className="text-gray-400" />
            {decodeHtml(marche.buyer)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-400" />
            {marche.departmentName || normalizeDept(marche.department || '')} ({normalizeDept(marche.department || '')})
            {marche.region && (
              <span className="text-gray-400">· {marche.region}</span>
            )}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-2" style={{ alignItems: 'start' }}>
        {/* Left column — Key info */}
        <div className="col-span-2 flex flex-col gap-2">
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-3">Informations cles</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {marche.value && (
              <Detail
                icon={<Banknote size={15} className="text-gray-400" />}
                label="Montant estimé"
                value={formatCurrency(marche.value)}
                highlight
              />
            )}
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
            {marche.procedureType && (
              <Detail
                icon={<Scale size={15} className="text-gray-400" />}
                label="Procédure"
                value={marche.procedureType}
              />
            )}
            <Detail
              icon={<Layers size={15} className="text-gray-400" />}
              label="Nombre de lots"
              value={`${marche.lots} lot${marche.lots > 1 ? 's' : ''}`}
            />
            {marche.duration && (
              <Detail
                icon={<Timer size={15} className="text-gray-400" />}
                label="Durée du marché"
                value={marche.duration}
              />
            )}
            {marche.cpvCode && (
              <Detail
                icon={<Tag size={15} className="text-gray-400" />}
                label="Code CPV"
                value={marche.cpvCode}
              />
            )}
            {marche.cpvLabel && (
              <Detail
                icon={<FileText size={15} className="text-gray-400" />}
                label="Descripteurs"
                value={marche.cpvLabel}
              />
            )}
          </div>
        </div>

          {/* ── RDV Widget — under key info ── */}
          {session && (
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: '#0F172A', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,194,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarCheck size={18} color="#00C2FF" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Besoin d&apos;aide sur cet appel d&apos;offres ?</h2>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>Un expert analyse gratuitement votre eligibilite et monte votre dossier de reponse.</p>
                </div>
              </div>
              {/* Body */}
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px 20px' }}>
                {rdvSuccess ? (
                  <div style={{ padding: '20px 16px', borderRadius: 8, background: 'rgba(0,194,255,0.05)', border: '1px solid rgba(0,194,255,0.15)', textAlign: 'center' }}>
                    <CheckCircle2 size={28} style={{ color: '#00C2FF', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0A1628', marginBottom: 4 }}>Demande envoyee !</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 12px' }}>Notre equipe vous recontactera sous 24h pour confirmer le creneau.</p>
                    <button
                      onClick={() => setRdvSuccess(false)}
                      style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#0A1628', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Faire une autre demande
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRdvSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Date *</label>
                      <input
                        type="date"
                        value={rdvDate}
                        onChange={(e) => setRdvDate(e.target.value)}
                        min={minDate}
                        required
                        style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Creneau *</label>
                      <select
                        value={rdvSlot}
                        onChange={(e) => setRdvSlot(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box', color: rdvSlot ? '#0A1628' : '#9CA3AF' }}
                      >
                        <option value="">Choisir...</option>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '2 1 200px', minWidth: 180 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Message (optionnel)</label>
                      <input
                        value={rdvMessage}
                        onChange={(e) => setRdvMessage(e.target.value)}
                        placeholder="Vos questions..."
                        style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={rdvLoading}
                      style={{
                        padding: '9px 20px', borderRadius: 6,
                        border: 'none', background: '#00C2FF',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: rdvLoading ? 'not-allowed' : 'pointer',
                        opacity: rdvLoading ? 0.6 : 1, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                      }}
                    >
                      <Send size={13} />
                      {rdvLoading ? 'Envoi...' : 'Demander un RDV gratuit'}
                    </button>
                  </form>
                )}
                {rdvError && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 11, color: '#991B1B' }}>
                    {rdvError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Localisation map ── */}
          {canResolveLocation(marche.department, marche.buyer) && (
            <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', zIndex: 0 }}>
              <div style={{ background: '#0F172A', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={16} style={{ color: '#00C2FF' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Localisation du marche</h2>
                {marche.departmentName && (
                  <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 'auto' }}>
                    {marche.departmentName} ({normalizeDept(marche.department || '')})
                  </span>
                )}
              </div>
              <DepartmentMap department={marche.department} departmentName={marche.departmentName} buyer={marche.buyer} />
            </div>
          )}
        </div>

        {/* Right column — Actions + Source */}
        <div className="flex flex-col gap-2">
          {/* Actions */}
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-3">Actions</h2>
            {sourceInfo ? (
              <a
                href={sourceInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient !text-xs !w-full !justify-center !py-2.5 !gap-2 no-underline mb-2.5"
              >
                <ExternalLink size={14} />
                {sourceInfo.direct ? 'Acceder a la consultation' : `Voir sur ${marche.source}`} →
              </a>
            ) : (
              <div className="text-[11px] text-gray-400 italic text-center mb-2.5 py-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 6 }}>
                <Download size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                DCE disponible sur la plateforme de l&apos;acheteur
              </div>
            )}
            <button
              onClick={toggleFav}
              className="btn-secondary !text-xs !w-full !justify-center !py-2.5 !gap-2"
              style={isFav ? { background: '#FFFBEB', borderColor: '#F59E0B', color: '#92400E' } : {}}
            >
              <Star size={14} fill={isFav ? '#F59E0B' : 'none'} color={isFav ? '#F59E0B' : 'currentColor'} />
              {isFav ? 'Consultation sauvegardee' : 'Sauvegarder cette consultation'}
            </button>
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
              Creer une alerte similaire
            </button>
          </div>

          {/* Source info */}
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-2">Source</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Plateforme</span>
                <span className="font-semibold">{marche.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Reference</span>
                <span className="font-mono text-[11px]">{marche.sourceRef}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Indexe le</span>
                <span>{formatDate(marche.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Similar consultations */}
          {marche.similar && marche.similar.length > 0 && (
            <SimilarConsultations items={marche.similar} />
          )}
        </div>
      </div>

      {/* ── Documents DCE ── */}
      <div style={{ marginTop: 2 }}>
        <DocumentsSection documents={marche.documents} sourceInfo={sourceInfo} />
      </div>
    </div>
  );
}

function SimilarConsultations({ items }: { items: any[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-sm font-bold mb-4">Appels d&apos;offres similaires</h2>
      <div className="space-y-3">
        {items.map((m: any) => {
          const dl = daysUntil(m.deadline);
          return (
            <Link
              key={m.id}
              href={`/marches/${m.id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
              style={{ border: '1px solid #F1F5F9' }}
            >
              <div className="flex items-start gap-2.5">
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, position: 'relative', overflow: 'hidden' }}>
                  <Image src={getRegionLogo(m.department)} alt="" width={24} height={24} style={{ objectFit: 'contain' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400 mb-0.5 truncate">
                    {decodeHtml(m.buyer)}
                  </div>
                  <div className="text-[13px] font-semibold text-gray-800 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {cleanTitle(m.title)}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {m.department && m.department !== '00' && (
                      <span className="text-[10px] text-gray-400">
                        <MapPin size={10} className="inline mr-0.5" style={{ verticalAlign: 'middle' }} />
                        {m.departmentName || m.department}
                      </span>
                    )}
                    <span className={getNatureBadge(m.nature)} style={{ fontSize: 9, padding: '1px 6px' }}>
                      {getNatureLabel(m.nature)}
                    </span>
                    {dl !== null && dl > 0 && (
                      <span className="text-[10px] text-amber-600 font-semibold">{dl}j restants</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getDocIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <File size={16} className="text-red-500" />;
    case 'doc':
    case 'docx':
    case 'odt':
      return <FileText size={16} className="text-blue-500" />;
    case 'xls':
    case 'xlsx':
    case 'ods':
    case 'csv':
      return <FileSpreadsheet size={16} className="text-emerald-600" />;
    case 'link':
      return <ExternalLink size={16} className="text-gray-400" />;
    default:
      return <File size={16} className="text-gray-400" />;
  }
}

function DocumentsSection({
  documents,
  sourceInfo,
}: {
  documents: any;
  sourceInfo: { url: string; direct: boolean } | null;
}) {
  const [open, setOpen] = useState(true);
  const docs: { name: string; url: string; type: string; size: string | null }[] =
    Array.isArray(documents) ? documents.filter((d: any) => d.type !== 'link') : [];

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between bg-transparent border-none cursor-pointer font-[inherit] text-left"
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: docs.length > 0
                ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                : '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={16} color={docs.length > 0 ? '#fff' : '#94A3B8'} />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900">Documents de la consultation</span>
            <span className="ml-2 text-[10px] text-gray-400">
              {docs.length > 0 ? `${docs.length} fichier(s)` : 'Non disponibles'}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5">
          {docs.length > 0 ? (
            <div className="space-y-1.5">
              {docs.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors no-underline group"
                >
                  {getDocIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-gray-700 group-hover:text-blue-600 truncate block">
                      {doc.name}
                    </span>
                    {doc.size && (
                      <span className="text-[10px] text-gray-400">{doc.size}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono shrink-0">
                    {doc.type}
                  </span>
                  <Download size={14} className="text-gray-300 group-hover:text-blue-500 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <FileText size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] text-gray-500">
                  Documents non disponibles sur notre plateforme.
                </p>
              </div>
              {sourceInfo && (
                <a
                  href={sourceInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 no-underline shrink-0 flex items-center gap-1"
                >
                  Consulter le DCE <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
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
