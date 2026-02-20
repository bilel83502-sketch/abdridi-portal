'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

const plans = [
  {
    id: 'DECOUVERTE',
    name: 'Découverte',
    price: 0,
    period: 'Gratuit',
    icon: Zap,
    color: '#6B7280',
    popular: false,
    features: [
      '10 consultations/jour',
      'Recherche basique',
      '93 sources officielles',
      'Pas d\'alertes email',
      'Pas de concurrence',
    ],
    negative: ['Pas d\'alertes email', 'Pas de concurrence'],
  },
  {
    id: 'VEILLE',
    name: 'Veille',
    price: 49,
    period: '/mois',
    icon: Sparkles,
    color: '#2563EB',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VEILLE || 'price_veille_placeholder',
    features: [
      'Consultations illimitées',
      'Alertes email personnalisées',
      'Analyse de concurrence',
      '93 sources officielles',
      'Export des données',
    ],
    negative: [] as string[],
  },
  {
    id: 'MONTAGE',
    name: 'Montage',
    price: 199,
    period: '/mois',
    icon: Crown,
    color: '#7C3AED',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTAGE || 'price_montage_placeholder',
    features: [
      'Tout le plan Veille',
      'Aide au montage de dossiers',
      'Templates de réponse',
      'Analyse détaillée DCE',
      'Support prioritaire',
    ],
    negative: [] as string[],
  },
];

function AbonnementContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentPlan = user?.role === 'ADMIN' ? 'ADMIN' : (user?.plan || 'DECOUVERTE');

  async function handleSubscribe(priceId: string, planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingPlan(null);
  }

  async function handleManage() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement</h1>
        <p className="text-sm text-gray-500">Choisissez le plan adapté à vos besoins</p>
      </div>

      {success && (
        <div style={{ maxWidth: 600, margin: '0 auto 24px', padding: '14px 18px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 14, textAlign: 'center' }}>
          Votre abonnement a été activé avec succès !
        </div>
      )}
      {canceled && (
        <div style={{ maxWidth: 600, margin: '0 auto 24px', padding: '14px 18px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 14, textAlign: 'center' }}>
          Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 960, margin: '0 auto' }}>
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isAdmin = currentPlan === 'ADMIN';
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                position: 'relative',
                border: plan.popular ? '2px solid #2563EB' : '1px solid #E5E7EB',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                  color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: 700,
                  padding: '6px 0', letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>
                  Populaire
                </div>
              )}

              <div style={{ padding: '32px 24px 24px', paddingTop: plan.popular ? 44 : 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${plan.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} style={{ color: plan.color }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{plan.name}</span>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 14, color: '#6B7280' }}>{plan.period}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {plan.features.map((f, i) => {
                    const isNeg = plan.negative.includes(f);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: isNeg ? '#9CA3AF' : '#374151' }}>
                        <Check size={16} style={{ color: isNeg ? '#D1D5DB' : plan.color, flexShrink: 0 }} />
                        <span style={{ textDecoration: isNeg ? 'line-through' : 'none' }}>{f}</span>
                      </div>
                    );
                  })}
                </div>

                {isAdmin ? (
                  <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                    Accès Admin illimité
                  </div>
                ) : isCurrent ? (
                  plan.id === 'DECOUVERTE' ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                      Plan actuel
                    </div>
                  ) : (
                    <button
                      onClick={handleManage}
                      style={{
                        width: '100%', padding: '12px 0', borderRadius: 8,
                        border: '1px solid #E5E7EB', background: '#fff',
                        fontSize: 14, fontWeight: 600, color: '#374151',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Gérer l&apos;abonnement
                    </button>
                  )
                ) : plan.price === 0 ? (
                  <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                    Plan de base
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.priceId!, plan.id)}
                    disabled={loadingPlan === plan.id}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 8,
                      border: 'none',
                      background: plan.popular
                        ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                        : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                      color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: loadingPlan === plan.id ? 'not-allowed' : 'pointer',
                      opacity: loadingPlan === plan.id ? 0.6 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {loadingPlan === plan.id ? 'Redirection...' : 'S\'abonner'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AbonnementPage() {
  return <Suspense fallback={<div>Chargement...</div>}><AbonnementContent /></Suspense>;
}
