'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Search, LayoutGrid, Bell, Settings, LogOut, Clock } from 'lucide-react';

const tabs = [
  { href: '/marches', label: 'Consultations', icon: Search },
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { href: '/alertes', label: 'Alertes', icon: Bell },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const initials = user?.company ? user.company.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'AB';

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--nav)' }}>
      {/* Gradient line */}
      <div className="h-[2px]" style={{ background: 'var(--gradient)' }} />

      <div className="max-w-[1220px] mx-auto px-8 flex items-center h-[52px]">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mr-9 no-underline">
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-[10px] text-white" style={{ background: 'var(--gradient)' }}>AB</div>
          <div>
            <span className="text-[13px] font-bold text-gray-100">AB </span>
            <span className="text-[13px] font-bold gradient-text">DRIDI</span>
          </div>
        </Link>

        {/* Nav tabs */}
        <nav className="flex gap-0.5 flex-1">
          {tabs.map(t => {
            const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="no-underline">
                <div className={`flex items-center gap-[7px] px-3.5 py-[7px] rounded-md text-[13px] transition-colors ${active ? 'bg-white/[0.07] text-gray-200 font-semibold' : 'text-gray-500 hover:text-gray-400'}`}>
                  <Icon size={15} className={active ? 'text-blue-300' : 'text-gray-600'} />
                  {t.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-[5px] px-2.5 py-[3px] rounded bg-emerald-500/10">
            <div className="w-[5px] h-[5px] rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">93 sources</span>
          </div>

          <div className="w-px h-5 bg-gray-800" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--gradient)' }}>
              {initials}
            </div>
            <span className="text-xs text-gray-400">{user?.company || user?.name || 'Mon compte'}</span>
          </div>

          <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="p-1 bg-transparent border-none cursor-pointer" title="Déconnexion">
            <LogOut size={15} className="text-gray-600 hover:text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
