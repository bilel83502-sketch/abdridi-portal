'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Pause, Play, Mail } from 'lucide-react';

function getNatureLabel(n:string){return{TRAVAUX:'Travaux',FOURNITURES:'Fournitures',SERVICES:'Services'}[n]||n;}
const DEPARTMENTS:Record<string,string>={'06':'Alpes-Maritimes','13':'Bouches-du-Rhône','31':'Haute-Garonne','33':'Gironde','35':'Ille-et-Vilaine','38':'Isère','44':'Loire-Atlantique','59':'Nord','69':'Rhône','75':'Paris'};

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({name:'',keywords:'',natures:[] as string[],frequency:'QUOTIDIEN'});

  async function fetchAlerts(){const res=await fetch('/api/alertes');setAlerts(await res.json());setLoading(false);}
  useEffect(()=>{fetchAlerts();},[]);

  async function createAlert(e:React.FormEvent){
    e.preventDefault();
    await fetch('/api/alertes',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:form.name,keywords:form.keywords.split(',').map(k=>k.trim()).filter(Boolean),natures:form.natures,frequency:form.frequency})});
    setShowNew(false);setForm({name:'',keywords:'',natures:[],frequency:'QUOTIDIEN'});fetchAlerts();
  }
  async function toggleAlert(id:string,active:boolean){
    await fetch('/api/alertes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,active:!active})});fetchAlerts();
  }
  async function deleteAlert(id:string){
    if(!confirm('Supprimer cette alerte ?'))return;
    await fetch(`/api/alertes?id=${id}`,{method:'DELETE'});fetchAlerts();
  }
  const freqLabel:any={IMMEDIAT:'Immédiat',QUOTIDIEN:'Quotidien',HEBDOMADAIRE:'Hebdomadaire'};

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div><h1 className="text-2xl font-bold text-txt tracking-tight">Mes alertes</h1>
          <p className="text-sm text-txt-muted mt-1">Recevez les nouveaux marchés par email automatiquement.</p></div>
        <button onClick={()=>setShowNew(true)} className="btn-cyan"><Plus size={16}/> Nouvelle alerte</button>
      </div>
      {showNew&&(
        <form onSubmit={createAlert} className="card p-6 space-y-4 animate-in">
          <h3 className="text-sm font-semibold text-txt">Créer une alerte</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-txt-muted mb-1.5">Nom *</label>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Ex: Travaux BTP Lyon" required/></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Mots-clés (virgule)</label>
              <input type="text" value={form.keywords} onChange={e=>setForm({...form,keywords:e.target.value})} className="input" placeholder="rénovation, construction"/></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Nature</label>
              <select multiple value={form.natures} onChange={e=>setForm({...form,natures:Array.from(e.target.selectedOptions,o=>o.value)})} className="input h-20">
                <option value="TRAVAUX">Travaux</option><option value="FOURNITURES">Fournitures</option><option value="SERVICES">Services</option></select></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Fréquence</label>
              <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} className="input">
                <option value="IMMEDIAT">Immédiat</option><option value="QUOTIDIEN">Quotidien</option><option value="HEBDOMADAIRE">Hebdomadaire</option></select></div>
          </div>
          <div className="flex gap-3"><button type="submit" className="btn-primary">Créer</button><button type="button" onClick={()=>setShowNew(false)} className="btn-secondary">Annuler</button></div>
        </form>
      )}
      {loading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin"/></div>
      :alerts.length===0?<div className="card p-12 text-center"><Bell size={32} className="mx-auto text-txt-faint mb-4"/><p className="text-sm text-txt-muted">Aucune alerte configurée.</p></div>
      :(
        <div className="space-y-3">{alerts.map(a=>(
          <div key={a.id} className={`card p-5 ${!a.active?'opacity-50':''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} className={a.active?'text-accent-cyan':'text-txt-faint'}/>
                  <h3 className="text-sm font-semibold text-txt">{a.name}</h3>
                  <span className={`badge text-[10px] ${a.active?'bg-accent-green/10 text-accent-green':'bg-white/[0.04] text-txt-faint'}`}>{a.active?'Active':'Pause'}</span>
                  <span className="badge bg-white/[0.04] text-txt-faint text-[10px]">{freqLabel[a.frequency]||a.frequency}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {a.keywords?.map((k:string,i:number)=><span key={i} className="px-2 py-0.5 rounded text-[10px] bg-accent-cyan/10 text-accent-cyan">{k}</span>)}
                  {a.natures?.map((n:string,i:number)=><span key={i} className="px-2 py-0.5 rounded text-[10px] bg-accent-amber/10 text-accent-amber">{getNatureLabel(n)}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>toggleAlert(a.id,a.active)} className="p-2 rounded-lg hover:bg-white/[0.04] text-txt-faint hover:text-txt">{a.active?<Pause size={14}/>:<Play size={14}/>}</button>
                <button onClick={()=>deleteAlert(a.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-txt-faint hover:text-red-400"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
