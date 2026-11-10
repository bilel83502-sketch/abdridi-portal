/**
 * Essai gratuit à l'inscription : 5 semaines d'accès complet, sans carte.
 *
 * Pas de colonne dédiée en base : un compte en essai a
 *   plan = 'ESSAI' et stripeCurrentPeriodEnd = date de fin d'essai.
 * À la fin, le cron /api/cron/trial le repasse en DECOUVERTE (gratuit limité).
 * S'il s'abonne pendant l'essai, le webhook Stripe le passe en VEILLE.
 */
export const TRIAL_PLAN = 'ESSAI';
export const TRIAL_DAYS = 35;
export const TRIAL_LABEL = '5 semaines';

const DAY_MS = 24 * 60 * 60 * 1000;

export function trialEndFrom(start: Date = new Date()): Date {
  return new Date(start.getTime() + TRIAL_DAYS * DAY_MS);
}

export function isTrialActive(user: { plan?: string | null; stripeCurrentPeriodEnd?: Date | string | null }): boolean {
  return (
    user.plan === TRIAL_PLAN &&
    !!user.stripeCurrentPeriodEnd &&
    new Date(user.stripeCurrentPeriodEnd).getTime() > Date.now()
  );
}

/** Jours restants, arrondi au supérieur (dernier jour = 1). 0 si terminé. */
export function trialDaysLeft(end: Date | string | null | undefined): number {
  if (!end) return 0;
  const ms = new Date(end).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / DAY_MS) : 0;
}
