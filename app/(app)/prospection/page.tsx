'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Calendar, Target, ChevronRight } from 'lucide-react';

type Mission = {
  id: string; name: string; aoTitle: string | null; deadline: string | null;
  totalProspects: number; contacted: number; progress: number;
};

export default function ProspectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN' && user?.role !== 'PROSPECTOR') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => { document.title = 'Prospection | AB DRIDI'; }, []);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'PROSPECTOR')) {
      fetch('/api/pilotage/missions').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setMissions(d);
      });
    }
  }, [user]);

  useEffect(() => { document.title = 'Prospection | AB DRIDI'; }, []);

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) return null;

  const activeMissions = missions.filter(m => (m as any).status === 'ACTIVE');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #10B981, #00C2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Phone size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Prospection</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{activeMissions.length} mission{activeMissions.length > 1 ? 's' : ''} active{activeMissions.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {activeMissions.length === 0 ? (
        <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 48, textAlign: 'center' }}>
          <Phone size={40} style={{ color: '#334155', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Aucune mission active pour le moment</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeMissions.map(m => {
            const aContacter = m.totalProspects - m.contacted;
            return (
              <Link key={m.id} href={`/prospection/${m.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20, transition: 'border-color 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#10B981')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#E2E8F0' }}>{m.name}</span>
                    <ChevronRight size={16} style={{ color: '#64748B' }} />
                  </div>
                  {m.aoTitle && <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{m.aoTitle}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: aContacter > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                      <Target size={13} /> {aContacter > 0 ? `${aContacter} à contacter` : 'Tous contactés'}
                    </span>
                    {m.deadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> {new Date(m.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: '#334155' }}>
                        <div style={{ width: `${m.progress}%`, height: '100%', borderRadius: 3, background: '#10B981', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{m.progress}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
