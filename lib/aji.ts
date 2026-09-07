/**
 * AJI EPLE — Marchés publics des établissements publics locaux d'enseignement.
 * URL listing : https://mapa.aji-france.com/mapa/marche/
 *
 * AJI = Association des Journées de l'Intendance, le portail mutualisé qu'elle
 * opère pour les EPLE (collèges, lycées, EREA). Volume estimé Sprint 1 :
 * +180 AO/an (transport scolaire, restauration, fournitures pédagogiques…).
 *
 * IMPORTANT — TODO PARSING :
 * Les sélecteurs CSS retenus ont été déduits par inspection préliminaire mais
 * doivent être confirmés avec un fetch manuel :
 *   curl -A "<UA>" "https://mapa.aji-france.com/mapa/marche/?page=1" > /tmp/aji.html
 * Tant que les sélecteurs ne sont pas validés sur du DOM réel, la fonction
 * retournera un tableau vide en cas d'écart (pas de crash, log d'avertissement).
 *
 * Le site bloquait précédemment les UA bots ; on conserve un UA complet
 * et un Accept-Language fr-FR pour minimiser le 403/empty body.
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://mapa.aji-france.com';
const LIST_URL = `${BASE_URL}/mapa/marche/`;
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

function parseFrenchDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
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

/* ───── Département depuis un code postal ou un libellé ───── */
function deptFromPostal(text: string | null | undefined): string {
  if (!text) return '00';
  // Code postal 5 chiffres → 2 premiers (ou 3 pour DOM 97x)
  const cpMatch = text.match(/\b(9[78]\d{3}|\d{5})\b/);
  if (cpMatch) {
    const cp = cpMatch[1];
    if (cp.startsWith('97') || cp.startsWith('98')) return cp.slice(0, 3);
    if (cp.startsWith('20')) {
      // Corse — heuristique : 20000-20190 = Corse-du-Sud (2A), 20200-20999 = Haute-Corse (2B)
      const n = parseInt(cp.slice(2), 10);
      return n < 200 ? '2A' : '2B';
    }
    return cp.slice(0, 2);
  }
  // Code département explicite "(75)" ou "Dept 75"
  const dm = text.match(/\b(2[AB]|9\d{2}|0?\d{2})\b/);
  return dm ? dm[1] : '00';
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

/* ───── Type retour conforme au modèle Marche ───── */
export interface AjiMarche {
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
function parseListingHtml(html: string): AjiMarche[] {
  const $ = cheerio.load(html);
  const out: AjiMarche[] = [];

  // TODO : Confirmer ces sélecteurs avec une vraie page MAPA AJI.
  // Le portail MAPA AJI utilise un tableau classique <table>/<tr>/<td>
  // ou une liste de <div class="annonce">. On tente les deux.
  let rows = $('table.liste tbody tr, table.annonces tbody tr');
  if (rows.length === 0) {
    rows = $('div.annonce, li.annonce, article.annonce');
  }
  if (rows.length === 0) {
    console.warn('[AJI] No rows matched — DOM may have changed, see lib/aji.ts TODO');
    return out;
  }

  rows.each((_i, el) => {
    const $row = $(el);

    // Titre + lien détail (objet du marché)
    const titleLink = $row.find('a').filter((_j, a) => {
      const href = $(a).attr('href') || '';
      return /marche|annonce|consultation/.test(href);
    }).first();

    const title = titleLink.text().trim() || $row.find('.objet, .titre, td:nth-child(2)').first().text().trim();
    if (!title) return;

    const href = titleLink.attr('href') || '';
    const detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    // Identifiant : on tente d'extraire un id numérique dans l'URL ; sinon hash du titre
    const idMatch = detailUrl.match(/[?&]id=(\d+)/) || detailUrl.match(/\/(\d{4,})(?:[\/?#-]|$)/);
    const externalId = idMatch ? idMatch[1] : Buffer.from(`${title}-${detailUrl}`).toString('base64').slice(0, 32);

    // Acheteur EPLE (collège / lycée / EREA + ville)
    const buyer =
      $row.find('.acheteur, .organisme, .eple, td:nth-child(1)').first().text().trim() ||
      'EPLE';

    // Date limite (cherche en colonne ou span dédié)
    const deadlineRaw =
      $row.find('.cloture, .dateLimite, .date-limite, td:nth-child(4)').first().text().trim() ||
      $row.find('time').first().attr('datetime') ||
      $row.find('time').first().text().trim();
    const deadline = parseFrenchDate(deadlineRaw);

    // Date publication
    const pubRaw =
      $row.find('.publication, .datePublication, .date-pub, td:nth-child(3)').first().text().trim();
    const publicationDate = parseFrenchDate(pubRaw);

    // CPV (souvent absent du listing — sera enrichi en V2)
    const cpvRaw = $row.find('.cpv, .codeCpv').first().text().trim();
    const cpvMatch = cpvRaw.match(/(\d{8})/);
    const cpvCode = cpvMatch ? cpvMatch[1] : null;

    // Nature (souvent absente du listing → fallback SERVICES, ce qui est le cas majoritaire EPLE)
    const natureRaw = $row.find('.nature, .typeMarche').first().text().trim();
    const nature = mapNature(natureRaw);

    // Procédure (MAPA majoritairement)
    const procedureType = $row.find('.procedure').first().text().trim() || 'MAPA';

    // Département : on essaye depuis l'acheteur (code postal souvent collé au nom EPLE)
    const dept = deptFromPostal(buyer);
    const deptInfo = DEPT_MAP[dept];

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
      source: 'AJI',
      sourceRef: `AJI-${externalId}`,
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
        const html = await res.text();
        // Si le body est trop court c'est probablement une page de blocage
        if (html.trim().length < 200) {
          console.warn(`[AJI] ${url} returned only ${html.length} bytes — likely blocked`);
          continue;
        }
        return html;
      }
      console.warn(`[AJI] ${url} returned ${res.status} (attempt ${attempt})`);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.warn(`[AJI] ${url} timed out (attempt ${attempt})`);
      } else {
        console.warn(`[AJI] fetch error attempt ${attempt}: ${err?.message || err}`);
      }
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

/**
 * Récupère les MAPA AJI EPLE.
 * Pagination simple via `?page=N`. Limite par défaut 500.
 */
export async function fetchAjiRecords(options?: {
  limit?: number;
  maxPages?: number;
}): Promise<AjiMarche[]> {
  const limit = options?.limit ?? 500;
  const maxPages = options?.maxPages ?? 30; // EPLE = volumétrie modérée
  const all: AjiMarche[] = [];
  const seen = new Set<string>();

  console.log(`[AJI] Fetching up to ${limit} records (maxPages=${maxPages})...`);

  for (let page = 1; page <= maxPages && all.length < limit; page++) {
    const url = `${LIST_URL}?page=${page}`;
    const html = await fetchWithRetry(url);
    if (!html) {
      console.warn(`[AJI] Skipping page ${page} (fetch failed or blocked)`);
      if (page === 1) {
        // Site visiblement encore bloquant — on s'arrête tout de suite
        break;
      }
      continue;
    }

    const pageRecords = parseListingHtml(html);
    if (pageRecords.length === 0) {
      console.log(`[AJI] Page ${page} returned 0 records — stopping`);
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
    console.log(`[AJI] Page ${page}: ${pageRecords.length} parsed, ${added} new (total: ${all.length})`);

    if (page < maxPages && all.length < limit) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.log(`[AJI] Total records mapped: ${all.length}`);
  return all;
}
