import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,

  beforeSend(event) {
    const sensitiveKeys = ['password', 'token', 'secret', 'session', 'creditCard', 'cvv', 'twoFactorSecret', 'backupCodes'];

    function scrub(obj: Record<string, any> | undefined) {
      if (!obj) return;
      for (const key of Object.keys(obj)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          obj[key] = '[FILTERED]';
        }
      }
    }

    scrub(event.extra);
    if (event.contexts) {
      for (const ctx of Object.values(event.contexts)) {
        if (ctx && typeof ctx === 'object') scrub(ctx as Record<string, any>);
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
