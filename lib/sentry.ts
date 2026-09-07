import * as Sentry from '@sentry/nextjs';

/**
 * Capture security events in Sentry for real-time monitoring.
 * Never throws — fails silently like audit logging.
 */
export function captureSecurityEvent(
  event: 'CSRF_REJECTED' | 'LOGIN_FAILED_THRESHOLD' | 'RATE_LIMIT_EXCEEDED' | 'UPLOAD_REJECTED' | 'TWO_FACTOR_FAILED',
  details: Record<string, unknown> = {},
): void {
  try {
    Sentry.captureMessage(`[SECURITY] ${event}`, {
      level: 'warning',
      tags: { security: 'true', event },
      extra: {
        ...details,
        // Scrub sensitive fields
        password: undefined,
        token: undefined,
        secret: undefined,
      },
    });
  } catch {
    // Never fail
  }
}
