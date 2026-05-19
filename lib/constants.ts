/**
 * Constantes partagées de l'application.
 * Centralise les valeurs sensibles utilisées par plusieurs modules.
 */

/**
 * Email du super-administrateur AB DRIDI.
 *
 * On lit d'abord la variable d'environnement ADMIN_EMAIL ; si elle est
 * absente (ce qui peut arriver après un reset .env.local ou un déploiement
 * Vercel sans variable configurée), on retombe sur une valeur en dur pour
 * éviter que le créateur du SaaS se retrouve traité comme un compte gratuit.
 *
 * Toujours comparer en lowercase pour éviter les bugs de casse Google OAuth.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'bilel83502@gmail.com').toLowerCase();

/**
 * Helper : compare un email arbitraire à l'email admin (tolère espaces / casse).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
