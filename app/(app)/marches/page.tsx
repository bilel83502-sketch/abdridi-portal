'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ExternalLink, Clock, MapPin, Building2 } from 'lucide-react';

const DEPARTMENTS: Record<string,string> = {'01':'Ain','02':'Aisne','06':'Alpes-Maritimes','13':'Bouches-du-Rhône','31':'Haute-Garonne','33':'Gironde','34':'Hérault','35':'Ille-et-Vilaine','38':'Isère','44':'Loire-Atlantique','59':'Nord','67':'Bas-Rhin','69':'Rhône','75':'Paris','93':'Seine-Saint-Denis'};
function formatCurrency(v:number|null){if(!v)return'—';if(v>=1e6)return`${(v/1e6).toFixed(1)}M€`;if(v>=1e3)return`${(v/1e3).toFixed(0)}K€`;return`${v}€`;}
function formatDate(d:string|null){if(!d)return'—';return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d));}
function daysUntil(d:string|null){if(!d)return null;return Math.ceil((new Date(d).getTime()-Date.now())/(1000*60*60*24));}
function getNatureColor(n:string){const m:any={TRAVAUX:{bg:'bg-amber-500/10',text:'text-amber-400',dot:'bg-amber-400'},FOURNITURES:{bg:'bg-indigo-500/10',text:'text-indigo-400',dot:'bg-indigo-400'},SERVICES:{bg:'bg-cyan-500/10',text:'text-cyan-400',dot:'bg-cyan-400'}};return m[n]||{bg:'bg-white/5',text:'text-white/60',dot:'bg-white/40'};}
function getNatureLabel(n:string){return{TRAVAUX:'Travaux',FOURNITURES:'Fournitures',SERVICES:'Services'}[n]||n;}
function getTypeLabel(t:string){return{APPEL_OFFRES:"Appel d'offres",PROCEDURE_ADAPTEE:'Procédure adaptée',MARCHE_NEGOCIE:'Marché négocié',DIALOGUE_COMPETITIF:'Dialogue compétitif',CONCESSION:'Concession',AUTRE:'Autre'}[t]||t;}

export default function MarchesPage() {
  const [marches, setMarches] = useState<any[]>([]);
  const [meta, setMeta] = useState({total:0,page:1,pages:1});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState('');
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('publicationDate');
  const [page, setPage] = useState(1);

  const fetchMarches = useCallback(async()=>{
    setLoading(true);
    const params = new URLSearchParams();
    if(q)params.set('q',q); if(nature)params.set('nature',nature); if(department)params.set('department',department);
    if(source)params.set('source',source); params.set('sort',sort); params.set('order','desc'); params.set('page',String(page)); params.set('limit','15');
    try{const res=await fetch(`/api/marches?${params}`);const data=await res.json();setMarches(data.data||[]);setMeta(data.meta||{total:0,page:1,pages:1});}catch(e){}
    setLoading(false);
  },[q,nature,department,source,sort,page]);

  useEffect(()=>{fetchMarches();},[fetchMarches]);
  function clearFilters(){setQ('');setNature('');setDepartment('');setSource('');setPage(1);}
  const activeFilters=[nature,department,source].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-txt tracking-tight">Marchés publics</h1>
        <p className="text-sm text-txt-muted mt-1">{meta.total.toLocaleString('fr-FR')} résultats · 93 sources · Mis à jour il y a 4 min</p>
      </div>
      <div className="flex gap-3 animate-in-d1">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-faint"/>
          <input type="text" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}} placeholder="Rechercher par titre, acheteur, mot-clé, CPV..." className="input pl-11"/>
        </div>
        <button onClick={()=>setShowFilters(!showFilters)} className={`btn-secondary px-4 ${showFilters?'border-accent-cyan/30 text-accent-cyan':''}`}>
          <SlidersHorizontal size={16}/> Filtres
          {activeFilters>0&&<span className="w-5 h-5 rounded-full bg-accent-cyan text-bg text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>
      </div>
      {showFilters&&(
        <div className="card p-5 animate-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-txt">Filtres avancés</h3>
            <button onClick={clearFilters} className="text-xs text-txt-faint hover:text-accent-cyan transition-colors flex items-center gap-1"><X size={12}/> Réinitialiser</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div><label className="block text-xs text-txt-muted mb-1.5">Nature</label>
              <select value={nature} onChange={e=>{setNature(e.target.value);setPage(1);}} className="input"><option value="">Toutes</option><option value="TRAVAUX">Travaux</option><option value="FOURNITURES">Fournitures</option><option value="SERVICES">Services</option></select></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Département</label>
              <select value={department} onChange={e=>{setDepartment(e.target.value);setPage(1);}} className="input"><option value="">Tous</option>{Object.entries(DEPARTMENTS).map(([c,n])=><option key={c} value={c}>{c} — {n}</option>)}</select></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Source</label>
              <select value={source} onChange={e=>{setSource(e.target.value);setPage(1);}} className="input"><option value="">Toutes</option>{['BOAMP','PLACE','TED','achatpublic.com','e-marchespublics','Maximilien','Mégalis Bretagne','UGAP','RESAH'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-txt-muted mb-1.5">Trier par</label>
              <select value={sort} onChange={e=>setSort(e.target.value)} className="input"><option value="publicationDate">Date de publication</option><option value="deadline">Date limite</option><option value="estimatedValue">Montant estimé</option></select></div>
          </div>
        </div>
      )}
      {loading?(<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin"/></div>
      ):marches.length===0?(<div className="card p-12 text-center"><Search size={32} className="mx-auto text-txt-faint mb-4"/><p className="text-sm text-txt-muted">Aucun marché trouvé.</p><button onClick={clearFilters} className="text-xs text-accent-cyan mt-2">Réinitialiser</button></div>
      ):(
        <div className="space-y-3">{marches.map((m)=>{
          const nc=getNatureColor(m.nature);const days=daysUntil(m.deadline);
          return(
            <div key={m.id} className="card-hover p-5 cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${nc.bg} ${nc.text}`}><span className={`w-1.5 h-1.5 rounded-full ${nc.dot}`}/>{getNatureLabel(m.nature)}</span>
                    <span className="badge bg-white/[0.04] text-txt-faint">{getTypeLabel(m.type)}</span>
                    {m.reference&&<span className="text-[10px] text-txt-faint font-mono">{m.reference}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-txt group-hover:text-accent-cyan transition-colors">{m.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-txt-muted">
                    <span className="flex items-center gap-1"><Building2 size={11}/> {m.buyer}</span>
                    <span className="flex items-center gap-1"><MapPin size={11}/> {DEPARTMENTS[m.department]||m.department} ({m.department})</span>
                    {m.lots&&<span>{m.lots} lot{m.lots>1?'s':''}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="text-lg font-bold text-txt">{formatCurrency(m.estimatedValue)}</p>
                  {days!==null&&<p className={`text-xs font-medium ${days<=7?'text-accent-amber':days<=0?'text-red-400':'text-txt-muted'}`}><Clock size={11} className="inline mr-1"/>{days>0?`${days}j restants`:'Expiré'}</p>}
                  <p className="text-[10px] text-txt-faint">{m.source} · {formatDate(m.publicationDate)}</p>
                  {m.sourceUrl&&<a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-accent-cyan hover:text-white transition-colors">Voir l'annonce <ExternalLink size={9}/></a>}
                </div>
              </div>
            </div>
          );
        })}</div>
      )}
      {meta.pages>1&&(
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary px-4 py-2 text-xs disabled:opacity-30">← Précédent</button>
          <span className="text-xs text-txt-muted px-4">Page {page} / {meta.pages}</span>
          <button disabled={page>=meta.pages} onClick={()=>setPage(p=>p+1)} className="btn-secondary px-4 py-2 text-xs disabled:opacity-30">Suivant →</button>
        </div>
      )}
    </div>
  );
}
