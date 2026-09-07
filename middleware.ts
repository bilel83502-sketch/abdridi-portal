import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import * as Sentry from '@sentry/nextjs';

const ALLOWED_HOSTS = [
  'portal.abdridi.com',
  'localhost:3000',
  'localhost',
];

// Paths that need CSRF protection on mutating methods
const CSRF_PROTECTED = ['/api/pilotage/', '/api/alertes', '/api/admin'];
// Paths excluded from CSRF (they have their own auth: signature or Bearer)
const CSRF_EXCLUDED = ['/api/auth/', '/api/stripe/webhook', '/api/cron/'];

function extractHost(url: string): string | null {
  try { return new URL(url).host; } catch { return null; }
}

function isCsrfProtected(pathname: string): boolean {
  if (CSRF_EXCLUDED.some(p => pathname.startsWith(p))) return false;
  return CSRF_PROTECTED.some(p => pathname.startsWith(p));
}

// Pages that require authentication (NextAuth middleware equivalent)
const AUTH_PAGES = [
  '/dashboard', '/marches', '/alertes', '/parametres',
  '/concurrence', '/abonnement', '/admin', '/rendez-vous',
  '/pilotage', '/prospection',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- CSRF check for protected API mutations ---
  if (isCsrfProtected(pathname)) {
    const method = req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const originHost = origin ? extractHost(origin) : null;
      const refererHost = referer ? extractHost(referer) : null;
      const host = originHost || refererHost;

      const isAllowed = host && (
        ALLOWED_HOSTS.includes(host) ||
        host.endsWith('.vercel.app') ||
        host.endsWith('.vercel.sh')
      );

      if (!isAllowed) {
        try {
          Sentry.captureMessage('[SECURITY] CSRF_REJECTED', {
            level: 'warning',
            tags: { security: 'true', event: 'CSRF_REJECTED' },
            extra: { pathname, method, origin: origin || 'none', referer: referer || 'none' },
          });
        } catch {}
        return NextResponse.json(
          { error: 'Requête cross-origin rejetée.' },
          { status: 403 },
        );
      }
    }
  }

  // --- Auth check for protected pages ---
  const isAuthPage = AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isAuthPage) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/marches/:path*',
    '/alertes/:path*',
    '/parametres/:path*',
    '/concurrence/:path*',
    '/abonnement/:path*',
    '/admin/:path*',
    '/rendez-vous/:path*',
    '/pilotage/:path*',
    '/prospection/:path*',
    '/api/pilotage/:path*',
    '/api/alertes/:path*',
    '/api/admin/:path*',
  ],
};
