import { prisma } from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UAParser } from 'ua-parser-js';

type AuditParams = {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  request?: Request;
  metadata?: Record<string, any>;
  success?: boolean;
  requestPath?: string;
  responseTime?: number;
  statusCode?: number;
};

function extractIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || null;
}

function parseUserAgent(ua: string | null) {
  if (!ua) return { deviceType: null, browserName: null, osName: null };
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return {
    deviceType: device.type || 'desktop',
    browserName: browser.name || null,
    osName: os.name || null,
  };
}

/**
 * Log an audit event. Never throws — fails silently to avoid breaking the main request.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const req = params.request;
    const ip = extractIp(req);
    const ua = req?.headers.get('user-agent') || null;
    const { deviceType, browserName, osName } = parseUserAgent(ua);

    // Vercel geo headers (free, automatic on Vercel)
    const country = req?.headers.get('x-vercel-ip-country') || null;
    const city = req?.headers.get('x-vercel-ip-city') || null;

    // Request path from URL
    let requestPath = params.requestPath || null;
    if (!requestPath && req) {
      try { requestPath = new URL(req.url).pathname; } catch {}
    }

    // If no user info provided, try to get from session
    let { userId, userEmail, userRole } = params;
    if (!userId && !userEmail) {
      try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (user) {
          userId = user.id;
          userEmail = user.email;
          userRole = user.role;
        }
      } catch {}
    }

    // Fire and forget — don't await in caller
    prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        userRole,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: ip,
        userAgent: ua ? ua.slice(0, 500) : null,
        metadata: params.metadata || undefined,
        success: params.success ?? true,
        country,
        city: city ? decodeURIComponent(city) : null,
        deviceType,
        browserName,
        osName,
        requestPath,
        responseTime: params.responseTime ?? null,
        statusCode: params.statusCode ?? null,
      },
    }).catch(() => {}); // swallow errors
  } catch {
    // Never fail
  }
}

/**
 * Shorthand: audit from a request with session already available.
 */
export function auditFromSession(
  user: { id?: string; email?: string; role?: string } | null,
  req: Request,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  success?: boolean,
) {
  logAudit({
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    action,
    resource,
    resourceId,
    request: req,
    metadata,
    success,
  });
}
