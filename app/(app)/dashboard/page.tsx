'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search, Bell, TrendingUp, Clock, ChevronRight, ArrowUpRight } from 'lucide-react';

const DEPARTMENTS: Record<string, string> = {
  '06':'Alpes-Maritimes','13':'Bouches-du-Rhône','31':'Haute-Garonne','33':'Gironde',
  '34':'Hérault','35':'Ille-et-Vilaine','38':'Isère','44':'Loire-Atlantique',
  '59':'Nord','67':'Bas-Rhin','69':'Rhône','75':'Paris','93':'Seine-Saint-Denis',
};

function formatCurrency(v: number | null) { if (!v) return '—'; if (v >= 1e6) return `${(v/1e6).toFixed(1)}M€`; if (v >= 1e3) return `${(v/1e3).toFixed(0)}K€`; return `${v}€`; }
function formatDate(d: string | null) { if (!d) return '—'; return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d)); }
function daysUntil(d: string | null) { if (!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/(1000*60*60*24)); }
function getNatureColor(n: string) { const m: any = { TRAVAUX:{bg:'bg-amber-500/10',text:'text-amber-400',dot:'bg-amber-400'}, FOURNITURES:{bg:'bg-indigo-500/10',text:'text-indigo-400',dot:'bg-indigo-400'}, SERVICES:{bg:'bg-cyan-500/10',text:'text-cyan-400',dot:'bg-cyan-400'} }; return m[n]||{bg:'bg-white/5',text:'text-white/60',dot:'bg-white/40'}; }
function getNatureLabel(n: string) { const m: any = { TRAVAUX:'Travaux',FOURNITURES:'Fournitures',SERVICES:'Services' }; return m[n]||n; }

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin"/></div>;

  const stats = [
    { label:'Marchés ouverts', value:data?.totalOpen||0, icon:Search, color:'text-accent-cyan', bg:'bg-accent-cyan/10' },
    { label:'Nouveaux cette semaine', value:data?.newThisWeek||0, icon:TrendingUp, color:'text-accent-green', bg:'bg-accent-green/10' },
    { label:'Clôturent sous 7j', value:data?.closingSoon||0, icon:Clock, color:'text-accent-amber', bg:'bg-accent-amber/10' },
    { label:'Alertes actives', value:data?.userAlerts||0, icon:Bell, color:'text-accent-indigo', bg:'bg-accent-indigo/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-txt tracking-tight">Bonjour, {session?.user?.name?.split(' ')[0]||'Bienvenue'}</h1>
        <p className="text-sm text-txt-muted mt-1">Voici un aperçu de vos marchés publics aujourd'hui.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s,i)=>(
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color}/></div>
              <span className="text-[10px] font-medium text-txt-faint uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-3xl font-extrabold text-txt tracking-tight">{s.value.toLocaleString('fr-FR')}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
            <h2 className="text-sm font-semibold text-txt">Derniers marchés publiés</h2>
            <Link href="/marches" className="text-xs text-accent-cyan hover:text-white transition-colors flex items-center gap-1">Voir tout <ChevronRight size={12}/></Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {data?.recentMarches?.map((m:any,i:number)=>{
              const nc=getNatureColor(m.nature); const days=daysUntil(m.deadline);
              return (
                <div key={i} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-txt truncate">{m.title}</p>
                      <p className="text-xs text-txt-muted mt-1">{m.buyer} · {DEPARTMENTS[m.department]||m.department} ({m.department})</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge ${nc.bg} ${nc.text}`}><span className={`w-1.5 h-1.5 rounded-full ${nc.dot}`}/>{getNatureLabel(m.nature)}</span>
                      <p className="text-sm font-bold text-txt mt-1">{formatCurrency(m.estimatedValue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-txt-faint">
                    <span>Source: {m.source}</span><span>·</span><span>Publié {formatDate(m.publicationDate)}</span>
                    {days!==null&&<><span>·</span><span className={days<=7?'text-accent-amber font-medium':''}>{days>0?`${days}j restants`:'Expiré'}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-txt mb-4">Par nature</h3>
            <div className="space-y-3">
              {data?.byNature?.map((n:any,i:number)=>{
                const nc=getNatureColor(n.nature); const pct=Math.round((n.count/(data.totalOpen||1))*100);
                return (<div key={i}><div className="flex justify-between text-xs mb-1.5"><span className={nc.text}>{getNatureLabel(n.nature)}</span><span className="text-txt-faint">{n.count} ({pct}%)</span></div><div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden"><div className={`h-full rounded-full ${nc.dot}`} style={{width:`${pct}%`}}/></div></div>);
              })}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-txt mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link href="/marches" className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <Search size={16} className="text-accent-cyan"/><span className="text-xs text-txt-secondary">Rechercher un marché</span><ArrowUpRight size={12} className="ml-auto text-txt-faint"/></Link>
              <Link href="/alertes" className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <Bell size={16} className="text-accent-indigo"/><span className="text-xs text-txt-secondary">Créer une alerte</span><ArrowUpRight size={12} className="ml-auto text-txt-faint"/></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
