import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PLANS = {
  DECOUVERTE: {
    name: 'D\u00e9couverte',
    price: 0,
    priceId: null,
    features: [
      '10 consultations/jour',
      'Recherche basique',
      '97 sources officielles',
    ],
  },
  VEILLE: {
    name: 'Veille & Accompagnement',
    price: 25.90,
    priceId: process.env.STRIPE_PRICE_VEILLE || '',
    features: [
      'Consultations illimit\u00e9es',
      'Alertes email personnalis\u00e9es',
      'Analyse de concurrence',
      '97 sources officielles',
      'Export des donn\u00e9es',
      'Prise de rendez-vous accompagnement',
    ],
  },
} as const;

export function hasActiveSubscription(user: {
  role?: string;
  plan?: string;
  stripeCurrentPeriodEnd?: Date | null;
}): boolean {
  // Admin always has access
  if (user.role === 'ADMIN') return true;
  // Check if subscription is still active
  if (user.stripeCurrentPeriodEnd) {
    return new Date(user.stripeCurrentPeriodEnd) > new Date();
  }
  return false;
}

export function getUserPlanName(user: {
  role?: string;
  plan?: string;
  stripeCurrentPeriodEnd?: Date | null;
}): string {
  if (user.role === 'ADMIN') return 'Admin';
  if (hasActiveSubscription(user)) return user.plan || 'VEILLE';
  return 'DECOUVERTE';
}
