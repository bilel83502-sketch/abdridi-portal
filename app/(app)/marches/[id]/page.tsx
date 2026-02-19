'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  daysUntil,
  getNatureLabel,
  getNatureBadge,
} from '@/lib/utils';

function buildBoampUrl(sourceRef: string | null): string | null {
  if (!sourceRef) return null;
  // sourceRef format: "BOAMP-26-17633" → idweb: "26-17633"
  const idweb = sourceRef.replace('BOAMP-', '');
  if (!idweb) return null;
  return `https://www.boamp.fr/pages/avis/?q=idweb:${idweb}`;
}

export default function MarcheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [marche, setMarche] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
  const boampUrl = buildBoampUrl(marche.sourceRef);

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
            {boampUrl && (
              <a
                href={boampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient !text-xs !w-full !justify-center !py-2.5 !gap-2 no-underline mb-2.5"
              >
                <ExternalLink size={14} />
                Voir l'annonce originale
              </a>
            )}
            {boampUrl ? (
              <a
                href={boampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !text-xs !w-full !justify-center !py-2.5 !gap-2 no-underline mb-2.5"
              >
                <Download size={14} />
                Télécharger le DCE
              </a>
            ) : (
              <div className="text-[11px] text-gray-400 italic text-center mb-2.5 py-2">
                DCE disponible sur la plateforme de l'acheteur
              </div>
            )}
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
