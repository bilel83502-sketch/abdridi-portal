'use client';

import { ArrowLeft, Database, Target, Clock, ShieldCheck, Cookie, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PolitiqueConfidentialitePage() {
  const router = useRouter();

  return (
    <div className="max-w-[640px]">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition mb-5"
      >
        <ArrowLeft size={15} /> Retour
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Politique de confidentialité</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Dernière mise à jour : 23 mars 2026. AB DRIDI s&apos;engage à protéger vos données personnelles conformément au RGPD.
        </p>
      </div>

      {/* Données collectées */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <Database size={16} className="text-blue-600" /> Données collectées
        </h2>
        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Lors de l&apos;inscription</span>
            <p className="text-[13px] text-gray-600 mt-0.5 leading-relaxed">
              Nom, prénom, adresse email, mot de passe (chiffré), raison sociale le cas échéant.
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Données de navigation</span>
            <p className="text-[13px] text-gray-600 mt-0.5 leading-relaxed">
              Adresse IP, type de navigateur, pages consultées, horodatage des visites, données de session.
            </p>
          </div>
        </div>
      </div>

      {/* Finalité du traitement */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <Target size={16} className="text-blue-600" /> Finalité du traitement
        </h2>
        <ul className="space-y-2">
          {[
            'Gestion de votre compte utilisateur et authentification',
            'Envoi d\u2019alertes personnalisées sur les marchés publics correspondant à vos critères',
            'Amélioration continue du service et de l\u2019expérience utilisateur',
            'Gestion de la relation commerciale et du support client',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Durée de conservation */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-600" /> Durée de conservation
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Données de compte</span>
            <span className="text-[13px] text-gray-600 mt-0.5">
              Durée de l&apos;inscription + 3 ans après la suppression du compte.
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Logs de connexion</span>
            <span className="text-[13px] text-gray-600 mt-0.5">12 mois.</span>
          </div>
        </div>
      </div>

      {/* Droits RGPD */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" /> Vos droits (RGPD)
        </h2>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :
        </p>
        <ul className="space-y-2 mb-4">
          {[
            { title: 'Droit d\u2019accès', desc: 'obtenir une copie de vos données personnelles' },
            { title: 'Droit de rectification', desc: 'corriger des données inexactes ou incomplètes' },
            { title: 'Droit de suppression', desc: 'demander l\u2019effacement de vos données' },
            { title: 'Droit à la portabilité', desc: 'recevoir vos données dans un format structuré' },
            { title: 'Droit d\u2019opposition', desc: 'vous opposer au traitement de vos données' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span><strong className="text-gray-700">{item.title}</strong> : {item.desc}</span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-gray-600">
          Pour exercer vos droits, contactez-nous à{' '}
          <a href="mailto:bilel83502@gmail.com" className="text-blue-600 hover:underline">bilel83502@gmail.com</a>.
        </p>
      </div>

      {/* Cookies */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <Cookie size={16} className="text-blue-600" /> Cookies
        </h2>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          Le site utilise des cookies strictement nécessaires au fonctionnement du service :
        </p>
        <div className="space-y-2">
          {[
            { name: 'Session NextAuth', desc: 'Authentification et maintien de votre session utilisateur.', type: 'Nécessaire' },
            { name: 'Consentement cookies', desc: 'Mémorisation de votre choix en matière de cookies.', type: 'Nécessaire' },
            { name: 'Analytics', desc: 'Mesure d\u2019audience anonymisée pour améliorer le service (si applicable).', type: 'Optionnel' },
          ].map((cookie, i) => (
            <div key={i} className="p-3 rounded-md bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[13px] font-semibold text-gray-700">{cookie.name}</span>
                <span className={`px-2 py-[2px] rounded text-[10px] font-bold ${cookie.type === 'Nécessaire' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {cookie.type}
                </span>
              </div>
              <p className="text-[12px] text-gray-500">{cookie.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact DPO */}
      <div className="card p-6">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <Mail size={16} className="text-blue-600" /> Contact DPO
        </h2>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter
          notre Délégué à la Protection des Données à l&apos;adresse suivante :{' '}
          <a href="mailto:bilel83502@gmail.com" className="text-blue-600 hover:underline">bilel83502@gmail.com</a>.
        </p>
        <p className="text-[13px] text-gray-500 mt-3">
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL :{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            www.cnil.fr
          </a>.
        </p>
      </div>
    </div>
  );
}
