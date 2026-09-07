import * as Sentry from '@sentry/nextjs';

function hasCookieConsent(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(/cookie_consent=([^;]+)/);
  return match?.[1] === 'accepted';
}

const consented = hasCookieConsent();

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.1,
  // Replay only with cookie consent (RGPD)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: consented ? 0.1 : 0,

  integrations: consented
    ? [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ]
    : [],

  beforeSend(event) {
    // Strip sensitive data from all events
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      const sensitiveKeys = ['password', 'token', 'secret', 'session', 'creditCard', 'cardNumber', 'cvv', 'twoFactorSecret', 'backupCodes'];
      for (const key of sensitiveKeys) {
        if (key in data) {
          (data as any)[key] = '[FILTERED]';
        }
      }
    }

    // Mask email addresses in breadcrumbs
    if (event.breadcrumbs) {
      for (const crumb of event.breadcrumbs) {
        if (crumb.message) {
          crumb.message = crumb.message.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL]'
          );
        }
      }
    }

    return event;
  },
});
