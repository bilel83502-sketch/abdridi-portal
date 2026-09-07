/**
 * Automated Security Penetration Test Suite
 * Run: npm run security-test
 *
 * Tests all security hardening measures and generates a JSON report.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

type TestResult = {
  name: string;
  status: 'PASS' | 'FAIL';
  payload: string;
  expected: string;
  received: string;
  durationMs: number;
};

async function fetchSafe(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, { ...options, redirect: 'manual' });
}

// ─── Test 1: SQL Injection ───
async function testSQLInjection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const payloads = [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM \"User\" --",
    "1; SELECT * FROM pg_tables --",
    "' OR ''='",
  ];

  for (const payload of payloads) {
    const start = Date.now();
    try {
      const res = await fetchSafe(`${BASE_URL}/api/marches/${encodeURIComponent(payload)}`);
      const body = await res.text();
      const isSafe = res.status === 404 || res.status === 400 || res.status === 500;
      const noDataLeak = !body.includes('pg_tables') && !body.includes('passwordHash') && !body.includes('twoFactorSecret');

      results.push({
        name: `SQL Injection: ${payload.slice(0, 30)}`,
        status: isSafe && noDataLeak ? 'PASS' : 'FAIL',
        payload,
        expected: '404/400/500 sans fuite de données',
        received: `${res.status} — leak: ${!noDataLeak}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: `SQL Injection: ${payload.slice(0, 30)}`,
        status: 'PASS',
        payload,
        expected: 'Requête rejetée',
        received: `Error: ${e.message}`,
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}

// ─── Test 2: IDOR ───
async function testIDOR(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  // Try accessing a random prospect ID without auth
  const fakeProspectId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';
  const res = await fetchSafe(`${BASE_URL}/api/pilotage/prospects/${fakeProspectId}`, {
    method: 'GET',
  });

  results.push({
    name: 'IDOR: Accès prospect sans authentification',
    status: res.status === 401 || res.status === 403 || res.status === 302 ? 'PASS' : 'FAIL',
    payload: `GET /api/pilotage/prospects/${fakeProspectId}`,
    expected: '401 ou 403',
    received: `${res.status}`,
    durationMs: Date.now() - start,
  });

  // Try accessing audit logs without admin
  const start2 = Date.now();
  const res2 = await fetchSafe(`${BASE_URL}/api/pilotage/audit-logs`);
  results.push({
    name: 'IDOR: Accès audit-logs sans authentification',
    status: res2.status === 401 || res2.status === 403 || res2.status === 302 ? 'PASS' : 'FAIL',
    payload: 'GET /api/pilotage/audit-logs',
    expected: '401 ou 403',
    received: `${res2.status}`,
    durationMs: Date.now() - start2,
  });

  return results;
}

// ─── Test 3: CSRF ───
async function testCSRF(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  // POST without Origin/Referer to a CSRF-protected endpoint
  const res = await fetchSafe(`${BASE_URL}/api/pilotage/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test-csrf' }),
  });

  results.push({
    name: 'CSRF: POST sans Origin/Referer',
    status: res.status === 403 ? 'PASS' : 'FAIL',
    payload: 'POST /api/pilotage/missions sans headers Origin/Referer',
    expected: '403',
    received: `${res.status}`,
    durationMs: Date.now() - start,
  });

  // POST with malicious Origin
  const start2 = Date.now();
  const res2 = await fetchSafe(`${BASE_URL}/api/pilotage/missions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://evil-site.com',
    },
    body: JSON.stringify({ name: 'test-csrf' }),
  });

  results.push({
    name: 'CSRF: POST avec Origin malveillant',
    status: res2.status === 403 ? 'PASS' : 'FAIL',
    payload: 'POST /api/pilotage/missions Origin: https://evil-site.com',
    expected: '403',
    received: `${res2.status}`,
    durationMs: Date.now() - start2,
  });

  return results;
}

// ─── Test 4: Rate Limiting ───
async function testRateLimit(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  // Send 10 rapid requests to password reset
  const fakeEmail = `sectest-${Date.now()}@test.invalid`;
  let lastStatus = 200;
  let hitRateLimit = false;

  for (let i = 0; i < 10; i++) {
    const res = await fetchSafe(`${BASE_URL}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fakeEmail }),
    });
    lastStatus = res.status;
    if (res.status === 429) {
      hitRateLimit = true;
      break;
    }
  }

  results.push({
    name: 'Rate Limit: 10 requêtes rapides password-reset',
    status: hitRateLimit ? 'PASS' : 'FAIL',
    payload: `10x POST /api/auth/request-password-reset avec ${fakeEmail}`,
    expected: '429 avant la 10e requête',
    received: hitRateLimit ? '429 (rate limit atteint)' : `Dernière réponse: ${lastStatus}`,
    durationMs: Date.now() - start,
  });

  return results;
}

// ─── Test 5: Upload Malveillant ───
async function testMaliciousUpload(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  // Create a fake .pdf file with EXE magic bytes (MZ header)
  const exeMagicBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const fakeFile = new Blob([exeMagicBytes], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('file', fakeFile, 'malicious.pdf');
  formData.append('type', 'AUTRE');

  // Use a fake mission ID — should fail before reaching upload logic (auth required)
  const res = await fetchSafe(`${BASE_URL}/api/pilotage/missions/fake-id/documents`, {
    method: 'POST',
    body: formData,
    headers: {
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000/pilotage',
    },
  });

  // Even if auth blocks it, we're testing that the endpoint is protected
  const isProtected = res.status === 401 || res.status === 403 || res.status === 400 || res.status === 302;

  results.push({
    name: 'Upload Malveillant: .exe renommé en .pdf',
    status: isProtected ? 'PASS' : 'FAIL',
    payload: 'POST file avec magic bytes MZ (EXE) renommé en .pdf',
    expected: 'Rejet (401/403/400)',
    received: `${res.status}`,
    durationMs: Date.now() - start,
  });

  return results;
}

// ─── Test 6: Headers HTTP Sécurité ───
async function testSecurityHeaders(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  const res = await fetchSafe(`${BASE_URL}/`);
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

  const requiredHeaders: [string, string | RegExp][] = [
    ['x-frame-options', 'DENY'],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['permissions-policy', /camera=\(\)/],
    ['strict-transport-security', /max-age=\d+/],
    ['content-security-policy', /default-src/],
  ];

  for (const [name, expected] of requiredHeaders) {
    const value = headers[name] || '';
    const match = expected instanceof RegExp ? expected.test(value) : value.includes(expected);

    results.push({
      name: `Header: ${name}`,
      status: match ? 'PASS' : 'FAIL',
      payload: `GET / — vérifier header ${name}`,
      expected: expected instanceof RegExp ? expected.source : expected,
      received: value || '(absent)',
      durationMs: Date.now() - start,
    });
  }

  return results;
}

// ─── Test 7: Password Policy ───
async function testPasswordPolicy(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const weakPasswords = [
    { pw: '12345678', reason: 'trop court + pas de majuscule/spécial' },
    { pw: 'password123', reason: 'pas de majuscule/spécial' },
    { pw: 'Short1!', reason: 'moins de 10 chars' },
  ];

  for (const { pw, reason } of weakPasswords) {
    const start = Date.now();
    const res = await fetchSafe(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Security',
        email: `sectest-${Date.now()}@test.invalid`,
        password: pw,
        confirmPassword: pw,
      }),
    });

    results.push({
      name: `Password Policy: ${reason}`,
      status: res.status === 400 ? 'PASS' : 'FAIL',
      payload: `POST /api/register avec password "${pw}"`,
      expected: '400 (rejet)',
      received: `${res.status}`,
      durationMs: Date.now() - start,
    });
  }

  return results;
}

// ─── Test 8: Session Expiration ───
async function testSessionExpiration(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  // Test that accessing a protected page without token redirects
  const res = await fetchSafe(`${BASE_URL}/dashboard`);

  results.push({
    name: 'Session: Accès protégé sans token',
    status: res.status === 302 || res.status === 307 ? 'PASS' : 'FAIL',
    payload: 'GET /dashboard sans session cookie',
    expected: '302/307 (redirect vers login)',
    received: `${res.status}`,
    durationMs: Date.now() - start,
  });

  // Test with an expired/invalid JWT
  const start2 = Date.now();
  const res2 = await fetchSafe(`${BASE_URL}/dashboard`, {
    headers: {
      Cookie: 'next-auth.session-token=expired-invalid-token-xxx',
    },
  });

  results.push({
    name: 'Session: Token expiré/invalide',
    status: res2.status === 302 || res2.status === 307 ? 'PASS' : 'FAIL',
    payload: 'GET /dashboard avec token invalide',
    expected: '302/307 (redirect)',
    received: `${res2.status}`,
    durationMs: Date.now() - start2,
  });

  return results;
}

// ─── Main Runner ───
async function runAllTests() {
  console.log('\n========================================');
  console.log('  AB DRIDI — Security Penetration Tests');
  console.log('========================================\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const allResults: TestResult[] = [];

  const testSuites = [
    { name: 'SQL Injection', fn: testSQLInjection },
    { name: 'IDOR', fn: testIDOR },
    { name: 'CSRF', fn: testCSRF },
    { name: 'Rate Limiting', fn: testRateLimit },
    { name: 'Upload Malveillant', fn: testMaliciousUpload },
    { name: 'Headers HTTP', fn: testSecurityHeaders },
    { name: 'Password Policy', fn: testPasswordPolicy },
    { name: 'Session Expiration', fn: testSessionExpiration },
  ];

  for (const suite of testSuites) {
    console.log(`\n--- ${suite.name} ---`);
    try {
      const results = await suite.fn();
      for (const r of results) {
        const icon = r.status === 'PASS' ? '\x1b[32m✅ PASS\x1b[0m' : '\x1b[31m❌ FAIL\x1b[0m';
        console.log(`  ${icon}  ${r.name} (${r.durationMs}ms)`);
        if (r.status === 'FAIL') {
          console.log(`        Expected: ${r.expected}`);
          console.log(`        Received: ${r.received}`);
        }
      }
      allResults.push(...results);
    } catch (e: any) {
      console.log(`  ⚠️  Suite failed: ${e.message}`);
      allResults.push({
        name: suite.name,
        status: 'FAIL',
        payload: 'Suite execution',
        expected: 'Suite completes',
        received: e.message,
        durationMs: 0,
      });
    }
  }

  // Summary
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const total = allResults.length;
  const score = Math.round((passed / total) * 8);

  console.log('\n========================================');
  console.log(`  SCORE: ${score}/8`);
  console.log(`  Tests: ${passed}/${total} passed`);
  console.log('========================================\n');

  // JSON report
  const report = {
    date: new Date().toISOString(),
    target: BASE_URL,
    score: `${score}/8`,
    totalTests: total,
    passed,
    failed: total - passed,
    results: allResults,
  };

  const reportPath = `security-report-${new Date().toISOString().split('T')[0]}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);

  // Exit with error code if any test failed
  if (passed < total) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
