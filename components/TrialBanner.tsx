'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TrialStatus = { status: 'ACTIVE' | 'EXPIRED' | 'NONE'; daysLeft?: number; endsAt?: string };

/**
 * Bandeau d'essai gratuit : « Essai gratuit — il vous reste X jours ».
 * Visible uniquement pour les clients en essai (ou dont l'essai vient de finir).
 */
export default function TrialBanner() {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/trial')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setTrial(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!trial || trial.status === 'NONE') return null;
  if (pathname?.startsWith('/abonnement')) return null;

  const days = trial.daysLeft ?? 0;
  const expired = trial.status === 'EXPIRED';
  const urgent = !expired && days <= 7;

  const bg = expired ? '#FEF2F2' : urgent ? '#FFFBEB' : '#EFF6FF';
  const border = expired ? '#FECACA' : urgent ? '#FDE68A' : '#BFDBFE';
  const color = expired ? '#991B1B' : urgent ? '#92400E' : '#1E40AF';
  const btn = expired ? '#DC2626' : urgent ? '#F59E0B' : '#3B82F6';

  const endLabel = trial.endsAt
    ? new Date(trial.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
    : '';

  return (
    <div role="status" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
      <div className="max-w-[1220px] mx-auto px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <span style={{ fontSize: 13, color }}>
          {expired ? (
            <>Votre essai gratuit est terminé. Abonnez-vous pour retrouver les appels d&apos;offres illimités et vos alertes.</>
          ) : (
            <>
              <strong>Essai gratuit</strong> — il vous reste <strong>{days} jour{days > 1 ? 's' : ''}</strong>
              {endLabel ? <> (jusqu&apos;au {endLabel})</> : null} d&apos;accès complet.
            </>
          )}
        </span>
        <Link
          href="/abonnement"
          style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: btn, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          {expired ? 'Réactiver mon accès →' : 'Garder mon accès →'}
        </Link>
      </div>
    </div>
  );
}
