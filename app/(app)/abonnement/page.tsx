'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Check, X, Zap, Sparkles } from 'lucide-react';

const plans = [
  {
    id: 'DECOUVERTE',
    name: 'D\u00e9couverte',
    price: 0,
    period: 'Gratuit',
    icon: Zap,
    color: '#6B7280',
    popular: false,
    features: [
      { text: '3 appels d\'offres visibles par jour', included: true },
      { text: 'R\u00e9sultats avec d\u00e9lai de 48h', included: true },
      { text: 'R\u00e9sultats au-del\u00e0 de 3 flout\u00e9s', included: true },
      { text: 'Prise de rendez-vous accompagnement', included: true },
      { text: 'Alertes email', included: false },
      { text: 'Veille concurrentielle', included: false },
      { text: 'Export des donn\u00e9es', included: false },
    ],
  },
  {
    id: 'VEILLE',
    name: 'Veille & Accompagnement',
    price: 25.90,
    period: '/mois',
    icon: Sparkles,
    color: '#2563EB',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VEILLE || undefined,
    features: [
      { text: 'Appels d\'offres illimit\u00e9s', included: true },
      { text: 'R\u00e9sultats en temps r\u00e9el', included: true },
      { text: 'Tous les filtres (CPV, montant, r\u00e9gion)', included: true },
      { text: 'Alertes email personnalis\u00e9es', included: true },
      { text: 'Veille concurrentielle compl\u00e8te', included: true },
      { text: 'Export des donn\u00e9es (CSV/Excel)', included: true },
      { text: 'Prise de rendez-vous accompagnement', included: true },
      { text: 'Support prioritaire', included: true },
    ],
  },
];

function AbonnementContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = user?.role === 'ADMIN' ? 'ADMIN' : (user?.plan || 'DECOUVERTE');

  async function handleSubscribe() {
    setLoadingPlan('VEILLE');
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Erreur lors de la redirection vers Stripe.');
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion.');
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
        <p className="text-sm text-gray-500">Choisissez le plan adapt&eacute; &agrave; vos besoins</p>
      </div>

      {success && (
        <div style={{ maxWidth: 600, margin: '0 auto 24px', padding: '14px 18px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>
          Abonnement activ&eacute; avec succ&egrave;s !
        </div>
      )}
      {canceled && (
        <div style={{ maxWidth: 600, margin: '0 auto 24px', padding: '14px 18px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 14, textAlign: 'center' }}>
          Paiement annul&eacute;. Vous pouvez r&eacute;essayer quand vous le souhaitez.
        </div>
      )}

      <div className="abonnement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 760, margin: '0 auto' }}>
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
                  POPULAIRE
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
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toFixed(2).replace('.', ',')}€`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 14, color: '#6B7280' }}>{plan.period}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: f.included ? '#374151' : '#9CA3AF' }}>
                      {f.included ? (
                        <Check size={16} style={{ color: plan.color, flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <X size={16} style={{ color: '#D1D5DB', flexShrink: 0, marginTop: 1 }} />
                      )}
                      <span style={{ textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {isAdmin ? (
                  <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                    Acc&egrave;s Admin illimit&eacute;
                  </div>
                ) : isCurrent && plan.id === 'DECOUVERTE' ? (
                  <div style={{
                    width: '100%', padding: '12px 0', borderRadius: 8,
                    background: '#F3F4F6', textAlign: 'center',
                    fontSize: 14, fontWeight: 600, color: '#9CA3AF',
                  }}>
                    Plan actuel
                  </div>
                ) : isCurrent && plan.id === 'VEILLE' ? (
                  <button
                    onClick={handleManage}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 8,
                      border: '1px solid #E5E7EB', background: '#fff',
                      fontSize: 14, fontWeight: 600, color: '#374151',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    G&eacute;rer l&apos;abonnement
                  </button>
                ) : plan.price === 0 ? (
                  <div style={{
                    width: '100%', padding: '12px 0', borderRadius: 8,
                    background: '#F9FAFB', textAlign: 'center',
                    fontSize: 13, color: '#9CA3AF',
                  }}>
                    Plan de base
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubscribe()}
                      disabled={loadingPlan === plan.id}
                      style={{
                        width: '100%', padding: '12px 0', borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                        color: '#fff', fontSize: 14, fontWeight: 600,
                        cursor: loadingPlan === plan.id ? 'not-allowed' : 'pointer',
                        opacity: loadingPlan === plan.id ? 0.6 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {loadingPlan === plan.id ? 'Redirection vers Stripe...' : 'S\'abonner \u2014 25,90\u20AC/mois'}
                    </button>
                    {error && (
                      <div style={{
                        marginTop: 8, padding: '10px 14px', borderRadius: 8,
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        color: '#DC2626', fontSize: 12, textAlign: 'center',
                      }}>
                        {error}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive mobile */}
      <style jsx>{`
        @media (max-width: 640px) {
          .abonnement-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AbonnementPage() {
  return <Suspense fallback={<div>Chargement...</div>}><AbonnementContent /></Suspense>;
}
