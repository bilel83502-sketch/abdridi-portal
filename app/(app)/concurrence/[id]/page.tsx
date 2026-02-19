'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Timer,
  Banknote,
  Scale,
  Trophy,
  Search,
  Hash,
  CreditCard,
  Globe,
} from 'lucide-react';
import { formatCurrency, formatDate, getNatureLabel } from '@/lib/utils';

export default function ConcurrenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [marche, setMarche] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/marches-attribues/${params.id}`)
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
        Chargement du marché attribué...
      </div>
    );
  }

  if (error || !marche) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 mb-4">Marché attribué introuvable.</p>
        <Link
          href="/concurrence"
          className="text-violet-600 text-sm font-semibold no-underline"
        >
          ← Retour à la veille concurrentielle
        </Link>
      </div>
    );
  }

  function getNatureBadgeDetail(n: string) {
    const map: Record<string, string> = {
      TRAVAUX:
        'px-2 py-[2px] rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200',
      FOURNITURES:
        'px-2 py-[2px] rounded text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200',
      SERVICES:
        'px-2 py-[2px] rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
    return map[n] || '';
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 bg-transparent border-none cursor-pointer font-[inherit] p-0"
      >
        <ArrowLeft size={15} /> Retour à la veille concurrentielle
      </button>

      {/* Header card */}
      <div className="card p-6 mb-3" style={{ borderTop: '2px solid #7C3AED' }}>
        <div className="flex gap-2 items-center flex-wrap mb-3">
          <span className={getNatureBadgeDetail(marche.nature)}>
            {getNatureLabel(marche.nature)}
          </span>
          {marche.procedure && (
            <span className="px-2 py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">
              {marche.procedure}
            </span>
          )}
          <span className="px-2 py-[2px] rounded text-[10px] bg-violet-50 text-violet-600 border border-violet-200 font-semibold">
            ATTRIBUÉ
          </span>
          <span className="text-[10px] text-gray-400 font-mono ml-auto">
            {marche.sourceRef}
          </span>
        </div>

        <h1 className="text-lg font-bold leading-snug mb-4">{marche.objet}</h1>

        <div className="flex gap-5 flex-wrap text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Building2 size={15} className="text-gray-400" />
            {marche.acheteurNom}
          </span>
          {marche.departementNom && (
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-gray-400" />
              {marche.departementNom} ({marche.departement})
              {marche.region && (
                <span className="text-gray-400">· {marche.region}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Left column — Key info */}
        <div className="col-span-2 card p-6">
          <h2 className="text-sm font-bold mb-4">Informations du marché</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Detail
              icon={<Banknote size={15} className="text-violet-400" />}
              label="Montant attribué"
              value={marche.montant ? formatCurrency(marche.montant) : null}
              placeholder="Non communiqué"
              highlight
            />
            <Detail
              icon={<Calendar size={15} className="text-gray-400" />}
              label="Date de notification"
              value={formatDate(marche.dateNotification)}
            />
            <Detail
              icon={<Scale size={15} className="text-gray-400" />}
              label="Procédure"
              value={marche.procedure || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<Timer size={15} className="text-gray-400" />}
              label="Durée du marché"
              value={marche.dureeMois ? `${marche.dureeMois} mois` : null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<Tag size={15} className="text-gray-400" />}
              label="Code CPV"
              value={marche.codeCPV || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<FileText size={15} className="text-gray-400" />}
              label="Descripteurs"
              value={marche.labelCPV || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<CreditCard size={15} className="text-gray-400" />}
              label="Forme de prix"
              value={marche.formePrix || null}
              placeholder="Non communiqué"
            />
            <Detail
              icon={<Globe size={15} className="text-gray-400" />}
              label="Lieu d'exécution"
              value={marche.lieuExecution || null}
              placeholder="Non communiqué"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* Winner card — HIGHLIGHTED */}
          <div
            className="card p-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(168,85,247,0.08))',
              borderColor: '#C4B5FD',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-violet-500" />
              <h2 className="text-sm font-bold text-violet-700">
                Titulaire (Gagnant)
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-violet-400 mb-0.5">
                  Entreprise
                </div>
                <div className="text-sm font-bold text-violet-800">
                  {marche.titulaireNom}
                </div>
              </div>
              {marche.titulaireSiret && (
                <div>
                  <div className="text-[11px] text-violet-400 mb-0.5">
                    SIRET
                  </div>
                  <div className="text-xs font-mono text-violet-600">
                    {marche.titulaireSiret}
                  </div>
                </div>
              )}
              {marche.titulaireCommune && (
                <div>
                  <div className="text-[11px] text-violet-400 mb-0.5">
                    Commune
                  </div>
                  <div className="text-xs text-violet-600">
                    {marche.titulaireCommune}
                  </div>
                </div>
              )}
              {marche.montant && (
                <div className="pt-2 border-t border-violet-200">
                  <div className="text-[11px] text-violet-400 mb-0.5">
                    Montant remporté
                  </div>
                  <div className="text-lg font-extrabold text-violet-700">
                    {formatCurrency(marche.montant)}
                  </div>
                </div>
              )}
            </div>

            {/* Search this company */}
            <button
              onClick={() =>
                router.push(
                  `/concurrence?q=${encodeURIComponent(marche.titulaireNom)}`
                )
              }
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-violet-300 bg-white text-violet-700 text-xs font-semibold cursor-pointer hover:bg-violet-50 transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <Search size={13} />
              Voir tous les marchés de cette entreprise
            </button>
          </div>

          {/* Acheteur card */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={15} className="text-gray-400" />
              <h2 className="text-sm font-bold">Acheteur</h2>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Nom</span>
                <span className="font-semibold text-right max-w-[170px] truncate">
                  {marche.acheteurNom}
                </span>
              </div>
              {marche.acheteurSiret && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">SIRET</span>
                  <span className="font-mono text-[11px]">
                    {marche.acheteurSiret}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Source card */}
          <div className="card p-6">
            <h2 className="text-sm font-bold mb-3">Source</h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Plateforme</span>
                <span className="font-semibold">{marche.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Référence</span>
                <span className="font-mono text-[11px]">
                  {marche.sourceRef}
                </span>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
        {value ? (
          <div
            className={`text-sm font-semibold ${highlight ? 'text-violet-700' : 'text-gray-700'}`}
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
