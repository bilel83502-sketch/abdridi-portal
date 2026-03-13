'use client';

import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';

export default function ParametresPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Paramètres</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Informations entreprise et abonnement.</p>
      </div>

      {/* Company info */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" /> Entreprise
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Raison sociale', v: user?.company || '' },
            { l: 'Email', v: user?.email || '', d: true },
            { l: 'Contact principal', v: user?.name || '' },
            { l: 'Téléphone', v: '' },
            { l: 'SIRET', v: '' },
            { l: 'Secteur d\'activité', v: '' },
          ].map((f, i) => (
            <div key={i}>
              <label className="label">{f.l}</label>
              <input defaultValue={f.v} disabled={f.d} className={`input ${f.d ? '!bg-gray-50 !text-gray-400' : ''}`} />
            </div>
          ))}
        </div>
        <button className="btn-primary !text-xs mt-4">Enregistrer</button>
      </div>

      {/* Subscription */}
      <div className="card p-6 mb-3.5">
        <h2 className="text-[13px] font-bold mb-3.5">Abonnement</h2>
        <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex justify-between items-center">
          <div>
            <div className="text-[15px] font-bold">
              <span className="gradient-text">{user?.plan === 'VEILLE' ? 'Veille & Accompagnement' : 'Découverte'}</span>
              <span className="font-normal text-gray-500 text-[13px] ml-2">
                {user?.plan === 'VEILLE' ? '— 25,90€/mois' : '— Gratuit'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user?.plan === 'VEILLE' ? 'Recherche illimitée · Alertes quotidiennes · Accès 101 sources' : '10 consultations/jour · Recherche basique · 101 sources'}</p>
          </div>
          <span className="px-3 py-[3px] rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Actif</span>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Besoin d'un accompagnement personnalisé ? — <span className="text-blue-600">contact@abdridi.com</span>
        </p>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="text-[13px] font-bold mb-3.5">Mot de passe</h2>
        <div className="flex flex-col gap-2.5 max-w-[320px]">
          {['Actuel', 'Nouveau', 'Confirmation'].map((l, i) => (
            <div key={i}>
              <label className="label">{l}</label>
              <input type="password" placeholder="••••••••" className="input" />
            </div>
          ))}
        </div>
        <button className="btn-secondary !text-xs mt-3.5">Mettre à jour</button>
      </div>
    </div>
  );
}
