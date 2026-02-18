'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Search, Bell, Settings, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href:'/dashboard', label:'Tableau de bord', icon:LayoutDashboard },
  { href:'/marches', label:'Marchés publics', icon:Search },
  { href:'/alertes', label:'Mes alertes', icon:Bell },
  { href:'/parametres', label:'Paramètres', icon:Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={()=>setOpen(!open)} className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-elevated border border-white/[0.06] lg:hidden">
        {open?<X size={18}/>:<Menu size={18}/>}
      </button>
      {open&&<div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={()=>setOpen(false)}/>}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-bg-elevated border-r border-white/[0.04] flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-bg" style={{background:'linear-gradient(135deg, #00C2FF, #6366F1, #A855F7)'}}>A</div>
            <div>
              <div className="text-sm font-extrabold tracking-[3px] text-txt">DRIDI</div>
              <div className="text-[8px] font-medium tracking-[2px] text-txt-faint uppercase">Portail Client</div>
            </div>
          </Link>
        </div>
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-accent-green/[0.06] border border-accent-green/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"/>
            <span className="text-[11px] font-medium text-accent-green">93 sources actives</span>
          </div>
          <p className="text-[10px] text-txt-faint mt-0.5">Dernière sync · il y a 4 min</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(item=>{
            const active=pathname===item.href||pathname.startsWith(item.href+'/');
            return(
              <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={active?'sidebar-link-active':'sidebar-link'}>
                <item.icon size={18} strokeWidth={active?2:1.5}/><span className="flex-1">{item.label}</span>
                {active&&<ChevronRight size={14} className="text-accent-cyan"/>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-indigo/20 flex items-center justify-center text-xs font-bold text-accent-indigo">
              {session?.user?.name?.charAt(0)||'?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-txt truncate">{session?.user?.name||'Utilisateur'}</p>
              <p className="text-[10px] text-txt-faint truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={()=>signOut({callbackUrl:'/auth/login'})} className="flex items-center gap-2 text-xs text-txt-faint hover:text-red-400 transition-colors w-full py-1">
            <LogOut size={14}/> Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
