import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const PLANS = {
  DECOUVERTE: {
    name: 'Découverte',
    price: 0,
    priceId: null,
    features: [
      '10 consultations/jour',
      'Recherche basique',
      'Pas d\'alertes email',
      'Pas de concurrence',
    ],
  },
  VEILLE: {
    name: 'Veille',
    price: 49,
    priceId: process.env.STRIPE_PRICE_VEILLE || 'price_veille_placeholder',
    features: [
      'Consultations illimitées',
      'Alertes email personnalisées',
      'Analyse de concurrence',
      '93 sources officielles',
      'Export des données',
    ],
  },
  MONTAGE: {
    name: 'Montage',
    price: 199,
    priceId: process.env.STRIPE_PRICE_MONTAGE || 'price_montage_placeholder',
    features: [
      'Tout le plan Veille',
      'Aide au montage de dossiers',
      'Templates de réponse',
      'Analyse détaillée DCE',
      'Support prioritaire',
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
