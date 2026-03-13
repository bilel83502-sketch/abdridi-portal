'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Search, LayoutGrid, Bell, Settings, LogOut, Eye, Menu, X, Shield, CreditCard, Calendar } from 'lucide-react';

const baseTabs = [
  { href: '/marches', label: 'Consultations', icon: Search },
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { href: '/alertes', label: 'Alertes', icon: Bell },
  { href: '/concurrence', label: 'Concurrence', icon: Eye },
  { href: '/rendez-vous', label: 'Rendez-vous', icon: Calendar },
  { href: '/parametres', label: 'Param\u00e8tres', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const isPaid = isAdmin || (user?.plan === 'VEILLE');
  const initials = user?.company ? user.company.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'AB';
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build tabs: add Admin tab for admins
  const tabs = isAdmin
    ? [...baseTabs, { href: '/admin', label: 'Admin', icon: Shield }]
    : baseTabs;

  // Free plan = not admin AND not paid subscriber
  const isFreePlan = !isAdmin && !isPaid;

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Subscription banner for free users only (NOT for admin or paid) */}
      {isFreePlan && (
        <div style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: 13,
          color: '#fff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <CreditCard size={14} />
          <span>Vous &ecirc;tes en plan D&eacute;couverte (3 march&eacute;s/jour)</span>
          <span style={{ opacity: 0.7 }}>&mdash;</span>
          <Link
            href="/abonnement"
            style={{
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Passez au plan Veille &amp; Accompagnement pour un acc&egrave;s illimit&eacute;
          </Link>
        </div>
      )}

      <header className="sticky top-0 z-50" style={{ background: 'var(--nav)' }}>
        {/* Gradient line */}
        <div className="h-[2px]" style={{ background: 'var(--gradient)' }} />

        <div className="max-w-[1220px] mx-auto px-4 md:px-8 flex items-center h-[52px]">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 mr-9 no-underline shrink-0">
            <Image src="/logo.png" alt="AB DRIDI" width={36} height={36} className="rounded-md" />
            <span className="text-[14px] font-bold text-white">AB DRIDI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="header-desktop-nav flex gap-0.5 flex-1">
            {tabs.map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              const Icon = t.icon;
              const isConcu = t.href === '/concurrence';
              const isAdminTab = t.href === '/admin';
              const isRdv = t.href === '/rendez-vous';
              return (
                <Link key={t.href} href={t.href} className="no-underline">
                  <div className={`flex items-center gap-[7px] px-3.5 py-[7px] rounded-md text-[13px] transition-colors ${active ? 'bg-white/[0.07] text-gray-200 font-semibold' : 'text-gray-500 hover:text-gray-400'}`}>
                    <Icon size={15} className={active ? (isConcu ? 'text-violet-300' : isAdminTab ? 'text-purple-300' : isRdv ? 'text-emerald-300' : 'text-blue-300') : 'text-gray-600'} />
                    {t.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Desktop right */}
          <div className="header-desktop-right flex items-center gap-3.5">
            <div className="flex items-center gap-[5px] px-2.5 py-[3px] rounded bg-emerald-500/10">
              <div className="w-[5px] h-[5px] rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400">101 sources</span>
            </div>

            <div className="w-px h-5 bg-gray-800" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--gradient)' }}>
                {initials}
              </div>
              <span className="text-xs text-gray-400">{user?.company || user?.name || 'Mon compte'}</span>
            </div>

            <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="p-1 bg-transparent border-none cursor-pointer" title="D\u00e9connexion">
              <LogOut size={15} className="text-gray-600 hover:text-gray-400" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="ml-auto flex items-center">
            <button className="header-hamburger" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="header-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="header-mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="header-mobile-menu-top">
              <Link href="/dashboard" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
                <Image src="/logo.png" alt="AB DRIDI" width={28} height={28} className="rounded-md" />
                <span className="text-sm font-bold text-white">AB DRIDI</span>
              </Link>
              <button className="header-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            {tabs.map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`header-mobile-link ${active ? 'header-mobile-link-active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  {t.label}
                </Link>
              );
            })}

            {/* Subscription link in mobile menu */}
            <Link
              href="/abonnement"
              className={`header-mobile-link ${pathname === '/abonnement' ? 'header-mobile-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <CreditCard size={18} />
              Abonnement
            </Link>

            <div className="header-mobile-bottom">
              <div className="header-mobile-user">
                <div className="header-mobile-user-badge">{initials}</div>
                <span className="header-mobile-user-name">{user?.company || user?.name || 'Mon compte'}</span>
              </div>
              <button
                className="header-mobile-logout"
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
              >
                <LogOut size={16} />
                Se d&eacute;connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
