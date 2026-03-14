'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, Eye, Calendar, CreditCard,
  LayoutGrid, Settings, LogOut, Shield, ChevronDown, Menu, X,
} from 'lucide-react';

// Main nav tabs (always visible)
const mainTabs = [
  { href: '/marches', label: 'Consultations', icon: Search },
  { href: '/concurrence', label: 'Concurrence', icon: Eye },
  { href: '/alertes', label: 'Alertes', icon: Bell },
  { href: '/rendez-vous', label: 'Rendez-vous', icon: Calendar },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const isPaid = isAdmin || user?.plan === 'VEILLE';
  const isFreePlan = !isAdmin && !isPaid;
  const initials = user?.company
    ? user.company.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'AB');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [pathname]);
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {/* Upgrade banner (free users only) */}
      {isFreePlan && (
        <div style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #00C2FF 100%)',
          padding: '7px 16px', textAlign: 'center',
          fontSize: 12, color: '#fff', fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <CreditCard size={13} />
          <span>Plan Découverte — 3 marchés/jour</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <Link href="/abonnement" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Passer au plan Veille &amp; Accompagnement →
          </Link>
        </div>
      )}

      <header className="sticky top-0 z-50" style={{ background: 'var(--nav)', borderBottom: '1px solid var(--nav-border)' }}>
        {/* Top accent line */}
        <div className="h-[2px]" style={{ background: 'var(--gradient)' }} />

        <div className="max-w-[1240px] mx-auto px-4 md:px-8 flex items-center h-[52px] gap-2">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 no-underline shrink-0 mr-6">
            <Image src="/logo.png" alt="AB DRIDI" width={30} height={30} className="rounded-md" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>AB DRIDI</span>
          </Link>

          {/* Desktop main nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {mainTabs.map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              const Icon = t.icon;
              return (
                <Link key={t.href} href={t.href} className="no-underline">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 7, fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#F1F5F9' : '#64748B',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={14} style={{ color: active ? 'var(--brand-accent)' : '#475569' }} />
                    {t.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {/* 102 sources badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>102 sources</span>
            </div>

            <div style={{ width: 1, height: 20, background: '#1E293B' }} />

            {/* Avatar + dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  background: 'var(--gradient)',
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.company || user?.name || 'Mon compte'}
                </span>
                <ChevronDown size={13} style={{ color: '#475569', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#1E293B', border: '1px solid #334155',
                  borderRadius: 10, padding: '6px', minWidth: 180,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 100,
                }}>
                  <DropItem href="/dashboard" icon={LayoutGrid} label="Tableau de bord" />
                  {isAdmin && <DropItem href="/admin" icon={Shield} label="Administration" />}
                  <DropItem href="/abonnement" icon={CreditCard} label="Abonnement" />
                  <DropItem href="/parametres" icon={Settings} label="Paramètres" />
                  <div style={{ height: 1, background: '#334155', margin: '6px 4px' }} />
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '8px 10px', borderRadius: 7,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#F87171', fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="ml-auto md:hidden" onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
              background: '#0F172A', padding: 20, overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Image src="/logo.png" alt="AB DRIDI" width={28} height={28} className="rounded-md" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>AB DRIDI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {[...mainTabs,
              { href: '/dashboard', label: 'Tableau de bord', icon: LayoutGrid },
              ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: Shield }] : []),
              { href: '/abonnement', label: 'Abonnement', icon: CreditCard },
              { href: '/parametres', label: 'Paramètres', icon: Settings },
            ].map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              const Icon = t.icon;
              return (
                <Link key={t.href} href={t.href} className="no-underline" onClick={() => setMobileOpen(false)}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                    fontSize: 14, fontWeight: active ? 600 : 400,
                    color: active ? '#F1F5F9' : '#64748B',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}>
                    <Icon size={16} />
                    {t.label}
                  </div>
                </Link>
              );
            })}

            <div style={{ height: 1, background: '#1E293B', margin: '12px 0' }} />
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#F87171', fontFamily: 'inherit',
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DropItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="no-underline">
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px', borderRadius: 7,
          fontSize: 13, color: '#CBD5E1', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#F1F5F9'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#CBD5E1'; }}
      >
        <Icon size={14} style={{ color: '#475569' }} />
        {label}
      </div>
    </Link>
  );
}
