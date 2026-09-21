/**
 * simap.ch — plateforme officielle des marchés publics suisses
 * (Confédération, cantons, communes). Trilingue de/fr/it.
 *
 * L'API JSON n'est pas documentée publiquement mais elle est stable et
 * utilisée par plusieurs intégrations open source. Particularité : le
 * serveur exige un cookie de session, posé par la première requête sur
 * /api ("Cookie Not accepted" sinon). On l'amorce donc explicitement.
 *
 * Endpoints utilisés :
 *   GET /api/cantons/v1?lang=fr                              → amorce du cookie
 *   GET /api/publications/v2/project/project-search           → liste paginée (curseur lastItem)
 *   GET /api/publications/v1/project/{p}/publication-details/{pub} → détail (délai, CPV)
 */

import { cantonFromId, SUISSE_REGION, CANTON_CH_UNKNOWN } from './cantons';

const BASE = 'https://www.simap.ch/api';
const UA = 'ABDridi-Portal/1.0 (+https://portal.abdridi.com)';

/* ───── Session (cookie) ───── */
let cookie: string | null = null;

async function ensureCookie(): Promise<string> {
  if (cookie) return cookie;
  const res = await fetch(`${BASE}/cantons/v1?lang=fr`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    redirect: 'follow',
  });
  // Node 18+ : getSetCookie() ; sinon on retombe sur l'en-tête brut
  const anyHeaders = res.headers as any;
  const setCookies: string[] = typeof anyHeaders.getSetCookie === 'function'
    ? anyHeaders.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);
  cookie = setCookies.map(c => c.split(';')[0]).filter(Boolean).join('; ');
  if (!cookie) throw new Error('simap.ch : impossible d\'obtenir le cookie de session');
  return cookie;
}

async function getJson(path: string, params: Record<string, string>): Promise<any> {
  const c = await ensureCookie();
  const url = `${BASE}${path}?${new URLSearchParams(params).toString()}`;
  let res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', Cookie: c } });
  if (res.status === 403 || res.status === 401) {
    // Cookie périmé : on le renouvelle une fois
    cookie = null;
    const c2 = await ensureCookie();
    res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', Cookie: c2 } });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`simap.ch ${res.status} sur ${path}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/* ───── Helpers ───── */
function pickLang(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    for (const l of ['fr', 'de', 'it', 'en']) {
      if (typeof v[l] === 'string' && v[l].trim()) return v[l].trim();
    }
    const first = Object.values(v).find(x => typeof x === 'string' && (x as string).trim());
    return (first as string) || null;
  }
  return String(v);
}

function toDate(v: any): Date | null {
  if (!v || typeof v !== 'string') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Parcours récursif : première valeur dont la clé matche le motif et le prédicat. */
function deepFind(obj: any, keyRe: RegExp, pred: (v: any) => boolean, depth = 0): any {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (keyRe.test(k) && pred(v)) return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const r = deepFind(v, keyRe, pred, depth + 1);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

const PROCESS_LABEL: Record<string, string> = {
  open: 'Procédure ouverte',
  selective: 'Procédure sélective',
  invitation: 'Procédure sur invitation',
  direct: 'Gré à gré',
  no_process: 'Sans procédure',
};

/* ───── Type de sortie (aligné sur Marche) ───── */
export interface SimapMarche {
  title: string;
  buyer: string;
  nature: string;
  department: string;
  departmentName: string | null;
  region: string | null;
  value: number | null;
  deadline: Date | null;
  publicationDate: Date | null;
  source: string;
  sourceRef: string;
  procedureType: string | null;
  cpvCode: string | null;
  cpvLabel: string | null;
  lots: number;
  duration: string | null;
  documents: any;
  status: string;
  /** Identifiants internes simap, nécessaires pour le détail */
  _projectId: string;
  _publicationId: string;
}

function mapProject(p: any): SimapMarche | null {
  const projectId = p?.id;
  const publicationId = p?.publicationId;
  if (!projectId || !publicationId) return null;

  const title = pickLang(p.title);
  const buyer = pickLang(p.procOfficeName);
  if (!title || !buyer) return null;

  const addr = p.orderAddress || {};
  const canton = cantonFromId(addr.cantonId);
  const dept = canton ? canton.code : CANTON_CH_UNKNOWN.code;
  const deptName = canton ? canton.name : CANTON_CH_UNKNOWN.name;

  // projectType simap : "works" | "supplies" | "services" (libellés variables)
  const pt = String(p.projectType || '').toLowerCase();
  const nature = /work|bau|travaux|construction/.test(pt) ? 'TRAVAUX'
    : /suppl|liefer|fourniture|goods/.test(pt) ? 'FOURNITURES'
    : 'SERVICES';

  const pubNumber = p.publicationNumber || publicationId;

  return {
    title: String(title).slice(0, 500),
    buyer: String(buyer).slice(0, 300),
    nature,
    department: dept,
    departmentName: deptName,
    region: SUISSE_REGION,
    value: null,
    deadline: null,
    publicationDate: toDate(p.publicationDate),
    source: 'SIMAP',
    sourceRef: `SIMAP-${publicationId}`,
    procedureType: PROCESS_LABEL[String(p.processType || '').toLowerCase()] || (p.processType ? String(p.processType) : null),
    cpvCode: null,
    cpvLabel: null,
    lots: 1,
    duration: null,
    documents: [{
      name: `Publication ${pubNumber} sur simap.ch`,
      url: `https://www.simap.ch/fr/publications?search=${encodeURIComponent(String(pubNumber))}`,
      type: 'link',
      size: null,
    }],
    status: 'OUVERT',
    _projectId: String(projectId),
    _publicationId: String(publicationId),
  };
}

/* ───── Liste des appels d'offres ouverts ───── */
export async function fetchSimapProjects(options?: { daysBack?: number; limit?: number; debug?: boolean }): Promise<SimapMarche[]> {
  const daysBack = options?.daysBack ?? 30;
  const limit = options?.limit ?? 500;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split('T')[0];

  const out: SimapMarche[] = [];
  let lastItem: string | null = null;
  let pages = 0;

  while (out.length < limit && pages < 50) {
    const params: Record<string, string> = {
      lang: 'fr',
      newestPubTypes: 'tender',
      newestPublicationFrom: sinceStr,
    };
    if (lastItem) params.lastItem = lastItem;

    const json = await getJson('/publications/v2/project/project-search', params);
    const projects: any[] = json?.projects || [];
    if (options?.debug && pages === 0) {
      console.log('[SIMAP][debug] clés réponse :', Object.keys(json || {}));
      console.log('[SIMAP][debug] premier projet brut :', JSON.stringify(projects[0], null, 2)?.slice(0, 3000));
    }
    if (projects.length === 0) break;

    for (const p of projects) {
      const m = mapProject(p);
      if (m) out.push(m);
      if (out.length >= limit) break;
    }

    const next = json?.pagination?.lastItem;
    if (!next || next === lastItem) break;
    lastItem = String(next);
    pages++;
  }

  console.log(`[SIMAP] ${out.length} appels d'offres ouverts depuis ${sinceStr}`);
  return out;
}

/* ───── Détail : délai de dépôt, CPV, valeur ───── */
export async function enrichSimapDetails(m: SimapMarche, debug = false): Promise<SimapMarche> {
  try {
    const d = await getJson(`/publications/v1/project/${m._projectId}/publication-details/${m._publicationId}`, { lang: 'fr' });
    if (debug) {
      console.log('[SIMAP][debug] clés détail :', Object.keys(d || {}));
      try {
        const fs = await import('fs');
        fs.writeFileSync('simap-debug-detail.json', JSON.stringify(d, null, 2));
        console.log('[SIMAP][debug] détail brut écrit dans simap-debug-detail.json');
      } catch { console.log('[SIMAP][debug] détail brut :', JSON.stringify(d, null, 2)?.slice(0, 4000)); }
    }

    const isDateStr = (v: any) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
    const deadlineRaw = deepFind(d, /(offer|submission|tender|bid)?deadline|dateOfferDeadline|offerDate|closingDate/i, isDateStr);
    if (deadlineRaw) m.deadline = toDate(deadlineRaw);

    const cpv = deepFind(d, /^cpv(Codes?|s)?$|mainCpv|cpvCode/i, (v: any) => v != null);
    if (Array.isArray(cpv) && cpv.length) {
      const first = cpv[0];
      m.cpvCode = typeof first === 'string' ? first : (first?.code || first?.id || null);
      m.cpvLabel = typeof first === 'object' ? pickLang(first?.label || first?.name || first?.description) : null;
    } else if (cpv && typeof cpv === 'object') {
      m.cpvCode = cpv.code || cpv.id || null;
      m.cpvLabel = pickLang(cpv.label || cpv.name || cpv.description);
    } else if (typeof cpv === 'string') {
      m.cpvCode = cpv;
    }

    const value = deepFind(d, /estimatedValue|contractValue|value|amount/i, (v: any) => typeof v === 'number' && v > 0);
    if (typeof value === 'number') m.value = value;

    const lots = deepFind(d, /^lots$/i, (v: any) => Array.isArray(v));
    if (Array.isArray(lots) && lots.length > 0) m.lots = lots.length;
  } catch (e: any) {
    console.warn(`[SIMAP] détail indisponible pour ${m.sourceRef}: ${e?.message}`);
  }
  return m;
}

/** Retire les champs internes avant insertion en base. */
export function toMarcheRecord(m: SimapMarche) {
  const { _projectId, _publicationId, ...rest } = m;
  return rest;
}
