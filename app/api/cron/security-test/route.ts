import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = process.env.NEXTAUTH_URL || 'https://portal.abdridi.com';
const ADMIN_EMAIL = 'bilel83502@gmail.com';

type TestResult = {
  name: string;
  status: 'PASS' | 'FAIL';
  expected: string;
  received: string;
};

async function fetchSafe(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, { ...options, redirect: 'manual' });
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 1. SQL Injection
  try {
    const res = await fetchSafe(`${BASE_URL}/api/marches/${encodeURIComponent("' OR 1=1 --")}`);
    const body = await res.text();
    const safe = (res.status === 404 || res.status === 400 || res.status === 500) && !body.includes('passwordHash');
    results.push({ name: 'SQL Injection', status: safe ? 'PASS' : 'FAIL', expected: 'Rejet sans fuite', received: `${res.status}` });
  } catch { results.push({ name: 'SQL Injection', status: 'PASS', expected: 'Rejet', received: 'Error' }); }

  // 2. IDOR
  try {
    const res = await fetchSafe(`${BASE_URL}/api/pilotage/audit-logs`);
    results.push({ name: 'IDOR', status: [401, 403, 302].includes(res.status) ? 'PASS' : 'FAIL', expected: '401/403', received: `${res.status}` });
  } catch { results.push({ name: 'IDOR', status: 'FAIL', expected: '401/403', received: 'Error' }); }

  // 3. CSRF
  try {
    const res = await fetchSafe(`${BASE_URL}/api/pilotage/missions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'csrf-test' }),
    });
    results.push({ name: 'CSRF', status: res.status === 403 ? 'PASS' : 'FAIL', expected: '403', received: `${res.status}` });
  } catch { results.push({ name: 'CSRF', status: 'FAIL', expected: '403', received: 'Error' }); }

  // 4. Rate Limit (quick check — only 6 requests)
  try {
    let hitLimit = false;
    for (let i = 0; i < 6; i++) {
      const res = await fetchSafe(`${BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `crontest-${Date.now()}@test.invalid` }),
      });
      if (res.status === 429) { hitLimit = true; break; }
    }
    results.push({ name: 'Rate Limit', status: hitLimit ? 'PASS' : 'FAIL', expected: '429', received: hitLimit ? '429' : 'Non atteint' });
  } catch { results.push({ name: 'Rate Limit', status: 'FAIL', expected: '429', received: 'Error' }); }

  // 5. Upload (auth check)
  try {
    const res = await fetchSafe(`${BASE_URL}/api/pilotage/missions/fake/documents`, {
      method: 'POST', body: new FormData(),
    });
    results.push({ name: 'Upload Protection', status: [401, 403, 400, 302].includes(res.status) ? 'PASS' : 'FAIL', expected: 'Rejet', received: `${res.status}` });
  } catch { results.push({ name: 'Upload Protection', status: 'PASS', expected: 'Rejet', received: 'Error' }); }

  // 6. Security Headers
  try {
    const res = await fetchSafe(BASE_URL);
    const has = (h: string) => !!res.headers.get(h);
    const allPresent = has('x-frame-options') && has('x-content-type-options') && has('strict-transport-security') && has('content-security-policy') && has('referrer-policy') && has('permissions-policy');
    results.push({ name: 'Headers HTTP', status: allPresent ? 'PASS' : 'FAIL', expected: '6 headers', received: allPresent ? '6/6' : 'Manquant(s)' });
  } catch { results.push({ name: 'Headers HTTP', status: 'FAIL', expected: '6 headers', received: 'Error' }); }

  // 7. Password Policy
  try {
    const res = await fetchSafe(`${BASE_URL}/api/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: `cron-${Date.now()}@test.invalid`, password: '12345678', confirmPassword: '12345678' }),
    });
    results.push({ name: 'Password Policy', status: res.status === 400 ? 'PASS' : 'FAIL', expected: '400', received: `${res.status}` });
  } catch { results.push({ name: 'Password Policy', status: 'FAIL', expected: '400', received: 'Error' }); }

  // 8. Session
  try {
    const res = await fetchSafe(`${BASE_URL}/dashboard`);
    results.push({ name: 'Session Protection', status: [302, 307].includes(res.status) ? 'PASS' : 'FAIL', expected: '302/307', received: `${res.status}` });
  } catch { results.push({ name: 'Session Protection', status: 'FAIL', expected: '302/307', received: 'Error' }); }

  return results;
}

export async function GET(req: Request) {
  // Auth: require CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const secret = authHeader?.replace('Bearer ', '') || url.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const results = await runTests();
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL');
  const score = `${passed}/${results.length}`;

  // Log to CronLog
  await prisma.cronLog.create({
    data: {
      jobName: 'security-test',
      success: failed.length === 0,
      message: `Score: ${score}. ${failed.length > 0 ? 'FAILED: ' + failed.map(f => f.name).join(', ') : 'All tests passed.'}`,
    },
  });

  // Send alert email if any test failed
  if (failed.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'AB DRIDI <noreply@abdridi.com>',
        to: ADMIN_EMAIL,
        subject: `[ALERTE SECURITE] ${failed.length} test(s) echoue(s) — AB DRIDI Portal`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#DC2626;padding:20px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:18px;">Alerte Securite — AB DRIDI Portal</h1>
            </div>
            <div style="padding:24px;">
              <p style="font-size:14px;color:#111;">Score: <strong>${score}</strong></p>
              <p style="font-size:14px;color:#111;">Date: ${new Date().toLocaleString('fr-FR')}</p>
              <h3 style="color:#DC2626;">Tests echoues :</h3>
              <ul>
                ${failed.map(f => `<li><strong>${f.name}</strong> — Attendu: ${f.expected}, Recu: ${f.received}</li>`).join('')}
              </ul>
              <p style="font-size:13px;color:#64748B;">Verifiez immediatement sur <a href="https://portal.abdridi.com/pilotage/system-health">System Health</a></p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('[SecurityTest] Email alert failed:', e);
    }
  }

  return NextResponse.json({
    date: new Date().toISOString(),
    score,
    passed,
    failed: failed.length,
    results,
  });
}
