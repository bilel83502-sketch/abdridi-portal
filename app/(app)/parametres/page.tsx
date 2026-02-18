'use client';

import { useSession } from 'next-auth/react';
import { User, Building2, Phone, Mail, Shield } from 'lucide-react';

export default function ParametresPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const plans:any = {
    VEILLE:{label:'Veille',desc:'Accès au portail de recherche et alertes email',color:'text-accent-cyan'},
    MONTAGE:{label:'Montage',desc:'Veille + montage complet de vos dossiers',color:'text-accent-indigo'},
    STRATEGIE:{label:'Stratégie',desc:'Veille + montage + conseil stratégique dédié',color:'text-accent-green'},
  };
  const plan = plans[user?.plan] || plans.VEILLE;

  return(
    <div className="space-y-6 max-w-2xl">
      <div className="animate-in"><h1 className="text-2xl font-bold text-txt tracking-tight">Paramètres</h1>
        <p className="text-sm text-txt-muted mt-1">Gérez votre compte et votre abonnement.</p></div>
      <div className="card p-6 space-y-4 animate-in-d1">
        <h2 className="text-sm font-semibold text-txt flex items-center gap-2"><User size={16} className="text-accent-cyan"/> Profil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-txt-muted mb-1.5">Nom</label><input type="text" defaultValue={user?.name||''} className="input"/></div>
          <div><label className="block text-xs text-txt-muted mb-1.5">Email</label><div className="flex items-center gap-2"><Mail size={14} className="text-txt-faint"/><input type="email" defaultValue={user?.email||''} className="input" disabled/></div></div>
          <div><label className="block text-xs text-txt-muted mb-1.5">Entreprise</label><div className="flex items-center gap-2"><Building2 size={14} className="text-txt-faint"/><input type="text" defaultValue={user?.company||''} className="input"/></div></div>
          <div><label className="block text-xs text-txt-muted mb-1.5">Téléphone</label><div className="flex items-center gap-2"><Phone size={14} className="text-txt-faint"/><input type="tel" className="input" placeholder="07 XX XX XX XX"/></div></div>
        </div>
        <button className="btn-primary text-sm">Sauvegarder</button>
      </div>
      <div className="card p-6 space-y-4 animate-in-d2">
        <h2 className="text-sm font-semibold text-txt flex items-center gap-2"><Shield size={16} className="text-accent-indigo"/> Abonnement</h2>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div><span className={`text-lg font-bold ${plan.color}`}>{plan.label}</span><p className="text-xs text-txt-muted mt-1">{plan.desc}</p></div>
            <span className="badge bg-accent-green/10 text-accent-green">Actif</span>
          </div>
        </div>
        <p className="text-xs text-txt-faint">Pour changer de formule : <a href="mailto:contact@abdridi.com" className="text-accent-cyan">contact@abdridi.com</a> ou <a href="tel:+33749845661" className="text-accent-cyan">07 49 84 56 61</a></p>
      </div>
      <div className="card p-6 space-y-4 animate-in-d3">
        <h2 className="text-sm font-semibold text-txt">Changer le mot de passe</h2>
        <div className="space-y-3 max-w-sm">
          <div><label className="block text-xs text-txt-muted mb-1.5">Actuel</label><input type="password" className="input" placeholder="••••••••"/></div>
          <div><label className="block text-xs text-txt-muted mb-1.5">Nouveau</label><input type="password" className="input" placeholder="••••••••"/></div>
          <div><label className="block text-xs text-txt-muted mb-1.5">Confirmer</label><input type="password" className="input" placeholder="••••••••"/></div>
        </div>
        <button className="btn-secondary text-sm">Mettre à jour</button>
      </div>
    </div>
  );
}
