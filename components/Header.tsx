'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Eye, Calendar, LayoutGrid, Settings, LogOut, Shield, ChevronDown, CreditCard, Menu, X } from 'lucide-react';

const MAIN_TABS = [
  { href: '/marches', label: 'Consultations' },
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/alertes', label: 'Alertes' },
  { href: '/concurrence', label: 'Concurrence' },
  { href: '/rendez-vous', label: 'Rendez-vous' },
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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Free plan banner */}
      {isFreePlan && (
        <div style={{
          background: 'var(--brand)', padding: '7px 16px',
          textAlign: 'center', fontSize: 12, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span>Plan Découverte — 3 marchés/jour</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <Link href="/abonnement" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}>
            Passer au plan Veille →
          </Link>
        </div>
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nav)',
        borderBottom: '1px solid var(--nav-border)',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', height: 56 }}>

          {/* Logo */}
          <Link href="/dashboard" style={{ marginRight: 32, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-serif, "Playfair Display", serif)', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
              <span style={{ color: 'var(--brand)' }}>AB</span>
              <span style={{ color: '#F1F5F9' }}> DRIDI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="header-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {MAIN_TABS.map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              return (
                <Link key={t.href} href={t.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    letterSpacing: '0.02em',
                    color: active ? '#F1F5F9' : '#64748B',
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}>{t.label}</div>
                </Link>
              );
            })}
          </nav>

          {/* Desktop right */}
          <div className="header-desktop-right" style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {/* 102 sources */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#10B981', letterSpacing: '0.04em' }}>102 sources</span>
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--nav-border)' }} />

            {/* Avatar dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 8, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg,#6366F1,#4F46E5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{initials}</div>
                <span style={{ fontSize: 12, color: '#64748B', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.company || user?.name || 'Mon compte'}
                </span>
                <ChevronDown size={12} style={{ color: '#475569', transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#1E293B', border: '1px solid #2D3F55',
                  borderRadius: 10, padding: 6, minWidth: 192,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
                }}>
                  <DropItem href="/abonnement" Icon={CreditCard} label="Abonnement" />
                  {isAdmin && <DropItem href="/admin" Icon={Shield} label="Administration" accent />}
                  <DropItem href="/parametres" Icon={Settings} label="Paramètres" />
                  <div style={{ height: 1, background: '#2D3F55', margin: '4px 0' }} />
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                      padding: '8px 10px', borderRadius: 7, background: 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 13, color: '#F87171',
                      fontFamily: 'inherit', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={14} />Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="header-hamburger"
            onClick={() => setMobileOpen(true)}
            style={{ marginLeft: 'auto', display: 'none' }}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={() => setMobileOpen(false)}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 272,
            background: 'var(--nav)', padding: '20px 0', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 16px', borderBottom: '1px solid var(--nav-border)', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-serif,"Playfair Display",serif)', fontSize: 17, fontWeight: 700 }}>
                <span style={{ color: 'var(--brand)' }}>AB</span><span style={{ color: '#F1F5F9' }}> DRIDI</span>
              </span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            {[...MAIN_TABS,
              ...(isAdmin ? [{ href: '/admin', label: 'Administration' }] : []),
              { href: '/abonnement', label: 'Abonnement' },
              { href: '/parametres', label: 'Paramètres' },
            ].map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              return (
                <Link key={t.href} href={t.href} style={{ display: 'block', padding: '11px 20px', fontSize: 14, fontWeight: active ? 500 : 400, color: active ? '#F1F5F9' : '#64748B', background: active ? 'rgba(255,255,255,0.06)' : 'transparent', textDecoration: 'none' }}>
                  {t.label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: 'var(--nav-border)', margin: '10px 0' }} />
            <button onClick={() => signOut({ callbackUrl: '/auth/login' })} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#F87171', fontFamily: 'inherit' }}>
              <LogOut size={15} />Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DropItem({ href, Icon, label, accent }: { href: string; Icon: any; label: string; accent?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, fontSize: 13, color: accent ? '#A5B4FC' : '#CBD5E1', cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#F1F5F9'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = accent ? '#A5B4FC' : '#CBD5E1'; }}
      >
        <Icon size={14} style={{ color: '#475569' }} />{label}
      </div>
    </Link>
  );
}
