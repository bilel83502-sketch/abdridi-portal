import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.1,

  beforeSend(event) {
    // Strip sensitive fields from event extras and contexts
    const sensitiveKeys = ['password', 'token', 'secret', 'session', 'email', 'twoFactorSecret', 'backupCodes'];

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

    return event;
  },
});
