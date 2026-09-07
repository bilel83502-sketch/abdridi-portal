/**
 * France Marchés (PQR) — Agrégateur national alimenté par la presse
 * quotidienne régionale (Ouest-France, Sud-Ouest, La Voix du Nord, etc.)
 * https://www.francemarches.com
 *
 * Couverture : ≈ 50 000 avis/an dont une part importante de transport public
 * (scolaire, sanitaire, voyageurs, fret). Cible Sprint 1 Acquisition : +400 AO
 * transport.
 *
 * Méthode : scraping HTML public via cheerio. Pas d'API documentée.
 * La page de listing tolère un filtre secteur dans l'URL.
 *
 * IMPORTANT — TODO PARSING :
 * Les sélecteurs CSS ci-dessous (`a.av-titre`, `.av-acheteur`, etc.) ont été
 * établis par inspection rapide et DOIVENT être confirmés en exécutant
 * `curl -A "<UA>" 'https://www.francemarches.com/marches-publics?secteur=transport'`
 * puis en passant la sortie dans un parseur HTML. Si le DOM diffère, ajuster
 * `parseListingHtml`. Tant que les sélecteurs ne sont pas validés, la fonction
 * retournera 0 résultat sans casser le build.
 *
 * Anti-bot : francemarches.com sert un challenge JS dans certains cas.
 * Le User-Agent honnête + Accept-Language fr-FR suffit en général ;
 * sinon il faudra envisager un proxy résidentiel (hors scope Sprint 1).
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.francemarches.com';
const LIST_PATH = '/marches-publics';
const PAGE_SIZE = 20; // observé sur la pagination par défaut
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/* ───── Mapping département → nom + région ───── */
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '01': { name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
  '02': { name: 'Aisne', region: 'Hauts-de-France' },
  '03': { name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
  '04': { name: 'Alpes-de-Haute-Provence', region: 'PACA' },
  '05': { name: 'Hautes-Alpes', region: 'PACA' },
  '06': { name: 'Alpes-Maritimes', region: 'PACA' },
  '07': { name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
  '08': { name: 'Ardennes', region: 'Grand Est' },
  '09': { name: 'Ariège', region: 'Occitanie' },
  '10': { name: 'Aube', region: 'Grand Est' },
  '11': { name: 'Aude', region: 'Occitanie' },
  '12': { name: 'Aveyron', region: 'Occitanie' },
  '13': { name: 'Bouches-du-Rhône', region: 'PACA' },
  '14': { name: 'Calvados', region: 'Normandie' },
  '15': { name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
  '16': { name: 'Charente', region: 'Nouvelle-Aquitaine' },
  '17': { name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  '18': { name: 'Cher', region: 'Centre-Val de Loire' },
  '19': { name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  '21': { name: "Côte-d'Or", region: 'Bourgogne-Franche-Comté' },
  '22': { name: "Côtes-d'Armor", region: 'Bretagne' },
  '23': { name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { name: 'Eure', region: 'Normandie' },
  '28': { name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '29': { name: 'Finistère', region: 'Bretagne' },
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '30': { name: 'Gard', region: 'Occitanie' },
  '31': { name: 'Haute-Garonne', region: 'Occitanie' },
  '32': { name: 'Gers', region: 'Occitanie' },
  '33': { name: 'Gironde', region: 'Nouvelle-Aquitaine' },
  '34': { name: 'Hérault', region: 'Occitanie' },
  '35': { name: 'Ille-et-Vilaine', region: 'Bretagne' },
  '36': { name: 'Indre', region: 'Centre-Val de Loire' },
  '37': { name: 'Indre-et-Loire', region: 'Centre-Val de Loire' },
  '38': { name: 'Isère', region: 'Auvergne-Rhône-Alpes' },
  '39': { name: 'Jura', region: 'Bourgogne-Franche-Comté' },
  '40': { name: 'Landes', region: 'Nouvelle-Aquitaine' },
  '41': { name: 'Loir-et-Cher', region: 'Centre-Val de Loire' },
  '42': { name: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  '43': { name: 'Haute-Loire', region: 'Auvergne-Rhône-Alpes' },
  '44': { name: 'Loire-Atlantique', region: 'Pays de la Loire' },
  '45': { name: 'Loiret', region: 'Centre-Val de Loire' },
  '46': { name: 'Lot', region: 'Occitanie' },
  '47': { name: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  '48': { name: 'Lozère', region: 'Occitanie' },
  '49': { name: 'Maine-et-Loire', region: 'Pays de la Loire' },
  '50': { name: 'Manche', region: 'Normandie' },
  '51': { name: 'Marne', region: 'Grand Est' },
  '52': { name: 'Haute-Marne', region: 'Grand Est' },
  '53': { name: 'Mayenne', region: 'Pays de la Loire' },
  '54': { name: 'Meurthe-et-Moselle', region: 'Grand Est' },
  '55': { name: 'Meuse', region: 'Grand Est' },
  '56': { name: 'Morbihan', region: 'Bretagne' },
  '57': { name: 'Moselle', region: 'Grand Est' },
  '58': { name: 'Nièvre', region: 'Bourgogne-Franche-Comté' },
  '59': { name: 'Nord', region: 'Hauts-de-France' },
  '60': { name: 'Oise', region: 'Hauts-de-France' },
  '61': { name: 'Orne', region: 'Normandie' },
  '62': { name: 'Pas-de-Calais', region: 'Hauts-de-France' },
  '63': { name: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes' },
  '64': { name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  '65': { name: 'Hautes-Pyrénées', region: 'Occitanie' },
  '66': { name: 'Pyrénées-Orientales', region: 'Occitanie' },
  '67': { name: 'Bas-Rhin', region: 'Grand Est' },
  '68': { name: 'Haut-Rhin', region: 'Grand Est' },
  '69': { name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  '70': { name: 'Haute-Saône', region: 'Bourgogne-Franche-Comté' },
  '71': { name: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
  '72': { name: 'Sarthe', region: 'Pays de la Loire' },
  '73': { name: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
  '74': { name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes' },
  '75': { name: 'Paris', region: 'Île-de-France' },
  '76': { name: 'Seine-Maritime', region: 'Normandie' },
  '77': { name: 'Seine-et-Marne', region: 'Île-de-France' },
  '78': { name: 'Yvelines', region: 'Île-de-France' },
  '79': { name: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  '80': { name: 'Somme', region: 'Hauts-de-France' },
  '81': { name: 'Tarn', region: 'Occitanie' },
  '82': { name: 'Tarn-et-Garonne', region: 'Occitanie' },
  '83': { name: 'Var', region: 'PACA' },
  '84': { name: 'Vaucluse', region: 'PACA' },
  '85': { name: 'Vendée', region: 'Pays de la Loire' },
  '86': { name: 'Vienne', region: 'Nouvelle-Aquitaine' },
  '87': { name: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  '88': { name: 'Vosges', region: 'Grand Est' },
  '89': { name: 'Yonne', region: 'Bourgogne-Franche-Comté' },
  '90': { name: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté' },
  '91': { name: 'Essonne', region: 'Île-de-France' },
  '92': { name: 'Hauts-de-Seine', region: 'Île-de-France' },
  '93': { name: 'Seine-Saint-Denis', region: 'Île-de-France' },
  '94': { name: 'Val-de-Marne', region: 'Île-de-France' },
  '95': { name: "Val-d'Oise", region: 'Île-de-France' },
  '971': { name: 'Guadeloupe', region: 'Outre-Mer' },
  '972': { name: 'Martinique', region: 'Outre-Mer' },
  '973': { name: 'Guyane', region: 'Outre-Mer' },
  '974': { name: 'La Réunion', region: 'Outre-Mer' },
  '976': { name: 'Mayotte', region: 'Outre-Mer' },
};

/* ───── Mois français → numéro ───── */
const MONTH_MAP: Record<string, string> = {
  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
};

function parseFrenchDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  // Format "12 mars 2026" ou "12/03/2026"
  let m = cleaned.match(/(\d{1,2})\s+([a-zûéè]+)\s+(\d{4})/);
  if (m) {
    const mm = MONTH_MAP[m[2]];
    if (!mm) return null;
    return new Date(`${m[3]}-${mm}-${m[1].padStart(2, '0')}T12:00:00+01:00`);
  }
  m = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    return new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T12:00:00+01:00`);
  }
  return null;
}

/* ───── Mapping nature texte libre → enum interne ───── */
function mapNature(raw: string | null): string {
  if (!raw) return 'SERVICES';
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  return 'SERVICES';
}

/* ───── Extraction département depuis un texte (code postal ou code dépt) ───── */
function extractDept(text: string | null | undefined): string {
  if (!text) return '00';
  // "(75)" ou "75 - Paris" ou code postal 75001
  const m = text.match(/\b(2[AB]|9\d{2}|0?\d{2})\b/);
  if (!m) return '00';
  const code = m[1];
  if (code.length === 2 || code === '2A' || code === '2B') return code;
  if (code.length === 3) return code; // DOM
  return '00';
}

/* ───── Type retour conforme au modèle Marche ───── */
export interface FranceMarchesMarche {
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
  status: string;
}

/* ───── Parser une page de listing HTML ───── */
function parseListingHtml(html: string): FranceMarchesMarche[] {
  const $ = cheerio.load(html);
  const out: FranceMarchesMarche[] = [];

  // TODO : Confirmer ces sélecteurs avec un fetch manuel. Plusieurs variantes
  // possibles sur francemarches.com selon le template A/B. On essaye trois
  // structures connues, dans l'ordre de probabilité.
  const candidateSelectors = [
    '.av-listing-item',          // template 1 (récent)
    'article.consultation',      // template 2
    'li.av-item, div.av-item',   // template 3 (fallback)
  ];

  let nodes: cheerio.Cheerio<any> | null = null;
  for (const sel of candidateSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      nodes = found;
      break;
    }
  }

  if (!nodes || nodes.length === 0) {
    console.warn('[FRANCE_MARCHES] No nodes matched any known selector — DOM has changed, see lib/francemarches.ts TODO');
    return out;
  }

  nodes.each((_i, el) => {
    const $el = $(el);

    // Titre + lien détail
    const titleEl = $el.find('a.av-titre, h2 a, h3 a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title || !href) return;
    const detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    // sourceRef : on dérive un id stable depuis l'URL détail (slug ou id num)
    const idMatch = detailUrl.match(/[\?&]id=(\d+)/) || detailUrl.match(/\/(\d{4,})(?:[\/?#-]|$)/) || detailUrl.match(/\/([a-z0-9-]+)\/?$/i);
    const externalId = idMatch ? idMatch[1] : Buffer.from(detailUrl).toString('base64').slice(0, 24);

    // Acheteur
    const buyer = $el.find('.av-acheteur, .acheteur, [class*="acheteur"]').first().text().trim()
      || $el.find('.av-organisme').first().text().trim()
      || 'Acheteur public';

    // Localisation (département / commune)
    const lieu = $el.find('.av-lieu, .lieu, [class*="dept"], .av-departement').first().text().trim();
    const dept = extractDept(lieu);
    const deptInfo = DEPT_MAP[dept];

    // Date limite
    const deadlineRaw = $el.find('.av-deadline, .av-cloture, [class*="cloture"], .deadline').first().text().trim();
    const deadline = parseFrenchDate(deadlineRaw);

    // Date publication
    const pubRaw = $el.find('.av-publication, .av-date, .date-publi, time').first().text().trim();
    const publicationDate = parseFrenchDate(pubRaw);

    // Nature (libellé)
    const natureRaw = $el.find('.av-nature, .nature').first().text().trim();
    const nature = mapNature(natureRaw);

    // Procédure
    const procedureType = $el.find('.av-procedure, .procedure').first().text().trim() || null;

    // CPV (rare en listing, généralement uniquement sur la fiche détail)
    const cpvRaw = $el.find('.av-cpv, .cpv').first().text().trim();
    const cpvMatch = cpvRaw.match(/(\d{8})/);
    const cpvCode = cpvMatch ? cpvMatch[1] : null;

    out.push({
      title: title.slice(0, 500),
      buyer: buyer.slice(0, 300),
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate,
      source: 'FRANCE_MARCHES',
      sourceRef: `FM-${externalId}`,
      procedureType,
      cpvCode,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: 'OUVERT',
    });
  });

  return out;
}

/* ───── Fetch avec retry léger ───── */
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.text();
      }
      console.warn(`[FRANCE_MARCHES] ${url} returned ${res.status} (attempt ${attempt})`);
    } catch (err: any) {
      console.warn(`[FRANCE_MARCHES] fetch error attempt ${attempt}: ${err?.message || err}`);
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

/**
 * Récupère les AO transport publiés sur francemarches.com.
 * Pagination simple via `?page=N`. Le filtre secteur=transport est
 * appliqué côté serveur quand l'URL est respectée.
 */
export async function fetchFranceMarchesRecords(options?: {
  limit?: number;
  maxPages?: number;
}): Promise<FranceMarchesMarche[]> {
  const limit = options?.limit ?? 800;
  const maxPages = options?.maxPages ?? Math.ceil(limit / PAGE_SIZE);
  const all: FranceMarchesMarche[] = [];
  const seen = new Set<string>();

  console.log(`[FRANCE_MARCHES] Fetching up to ${limit} records (maxPages=${maxPages})...`);

  for (let page = 1; page <= maxPages && all.length < limit; page++) {
    // TODO : valider le format d'URL. Variantes connues :
    //   /marches-publics?secteur=transport&page=2
    //   /marches-publics/transport?page=2
    //   /annonces?secteur=transport&p=2
    const url = `${BASE_URL}${LIST_PATH}?secteur=transport&page=${page}`;
    const html = await fetchWithRetry(url);
    if (!html) {
      console.warn(`[FRANCE_MARCHES] Skipping page ${page} (fetch failed)`);
      if (page === 1) break; // pas la peine d'insister si la 1re page échoue
      continue;
    }

    const pageRecords = parseListingHtml(html);
    if (pageRecords.length === 0) {
      console.log(`[FRANCE_MARCHES] Page ${page} returned 0 records — stopping`);
      break;
    }

    let added = 0;
    for (const rec of pageRecords) {
      if (seen.has(rec.sourceRef)) continue;
      seen.add(rec.sourceRef);
      all.push(rec);
      added++;
      if (all.length >= limit) break;
    }
    console.log(`[FRANCE_MARCHES] Page ${page}: ${pageRecords.length} found, ${added} new (total: ${all.length})`);

    // Pause polie pour ne pas se faire bannir
    if (page < maxPages && all.length < limit) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.log(`[FRANCE_MARCHES] Total records mapped: ${all.length}`);
  return all;
}
