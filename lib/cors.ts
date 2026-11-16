/**
 * CORS pour les endpoints publics appelés depuis le site vitrine abdridi.com
 * (formulaire de contact, compteur d'appels d'offres).
 */
const ALLOWED = ['https://abdridi.com', 'https://www.abdridi.com', 'https://portal.abdridi.com'];

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && (ALLOWED.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) ? origin : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
