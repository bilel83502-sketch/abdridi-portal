/**
 * Client pour les fichiers DECP consolidés de data.gouv.fr
 * Fichiers JSON volumineux (jusqu'à 649 MB) — streaming obligatoire
 * API : https://www.data.gouv.fr/api/1/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/
 */

import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { Readable } from 'stream';

// ── Mapping départements (copié depuis decp-attribue.ts) ──────────
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '01': { name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
  '02': { name: 'Aisne', region: 'Hauts-de-France' },
  '03': { name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
  '04': { name: 'Alpes-de-Haute-Provence', region: "Provence-Alpes-Côte d'Azur" },
  '05': { name: 'Hautes-Alpes', region: "Provence-Alpes-Côte d'Azur" },
  '06': { name: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  '07': { name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
  '08': { name: 'Ardennes', region: 'Grand Est' },
  '09': { name: 'Ariège', region: 'Occitanie' },
  '10': { name: 'Aube', region: 'Grand Est' },
  '11': { name: 'Aude', region: 'Occitanie' },
  '12': { name: 'Aveyron', region: 'Occitanie' },
  '13': { name: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  '14': { name: 'Calvados', region: 'Normandie' },
  '15': { name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
  '16': { name: 'Charente', region: 'Nouvelle-Aquitaine' },
  '17': { name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  '18': { name: 'Cher', region: 'Centre-Val de Loire' },
  '19': { name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '21': { name: "Côte-d'Or", region: 'Bourgogne-Franche-Comté' },
  '22': { name: "Côtes-d'Armor", region: 'Bretagne' },
  '23': { name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { name: 'Eure', region: 'Normandie' },
  '28': { name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '29': { name: 'Finistère', region: 'Bretagne' },
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
  '83': { name: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  '84': { name: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
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
  '971': { name: 'Guadeloupe', region: 'Guadeloupe' },
  '972': { name: 'Martinique', region: 'Martinique' },
  '973': { name: 'Guyane', region: 'Guyane' },
  '974': { name: 'La Réunion', region: 'La Réunion' },
  '976': { name: 'Mayotte', region: 'Mayotte' },
};

// ── Types ─────────────────────────────────────────────────────────

export interface DecpRawRecord {
  nature?: string;
  montant?: number;
  procedure?: string;
  objet?: string;
  dateNotification?: string;
  formePrix?: string;
  lieuExecution?: { code?: string; typeCode?: string };
  acheteur?: { id?: string };
  dureeMois?: number;
  id?: string;
  codeCPV?: string;
  datePublicationDonnees?: string;
  source?: string;
  titulaires?: Array<{
    titulaire?: { typeIdentifiant?: string; id?: string };
  }>;
}

export interface MarcheAttribueInput {
  objet: string;
  acheteurNom: string;
  acheteurSiret: string | null;
  titulaireNom: string;
  titulaireSiret: string | null;
  titulaireCommune: string | null;
  montant: number | null;
  dateNotification: Date | null;
  datePublicationDonnees: Date | null;
  nature: string;
  procedure: string | null;
  lieuExecution: string | null;
  departement: string | null;
  departementNom: string | null;
  region: string | null;
  codeCPV: string | null;
  labelCPV: string | null;
  source: string;
  sourceRef: string;
  dureeMois: number | null;
  formePrix: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────

function mapNatureFromText(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function extractDepartement(code: string | null | undefined): string | null {
  if (!code) return null;
  const s = code.toString().trim();
  if (s.length === 5) {
    const d = s.startsWith('97') ? s.slice(0, 3) : s.slice(0, 2);
    return DEPT_MAP[d] ? d : null;
  }
  if (DEPT_MAP[s]) return s;
  return null;
}

// ── Fetch file URLs from data.gouv.fr API ─────────────────────────

const DATASET_API =
  'https://www.data.gouv.fr/api/1/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/';

const DECP_FILE_PATTERN = /^decp-(\d{4}(?:-\d{2})?)\.json$/;

export async function fetchDecpFileUrls(): Promise<
  Map<string, { url: string; sizeMb: number }>
> {
  const res = await fetch(DATASET_API, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`data.gouv.fr API error: ${res.status}`);
  }

  const json = await res.json();
  const resources: any[] = json.resources || [];
  const result = new Map<string, { url: string; sizeMb: number }>();

  for (const r of resources) {
    if (r.format?.toLowerCase() !== 'json') continue;
    const title = r.title || '';
    const match = title.match(DECP_FILE_PATTERN);
    if (!match) continue;

    const key = match[1]; // "2024", "2025", "2026-03", etc.
    const sizeMb = r.filesize ? Math.round(r.filesize / 1024 / 1024) : 0;
    result.set(key, { url: r.url, sizeMb });
  }

  return result;
}

// ── Map a single DECP record + titulaire → MarcheAttribueInput ────

export function mapDecpRecord(
  raw: DecpRawRecord,
  titulaire: { id: string; type: string }
): MarcheAttribueInput {
  const acheteurSiret = raw.acheteur?.id
    ? String(raw.acheteur.id).padStart(14, '0')
    : null;

  const titulaireSiret = titulaire.id
    ? String(titulaire.id).padStart(14, '0')
    : null;

  const cpvRaw = raw.codeCPV || null;
  const codeCPV = cpvRaw ? cpvRaw.split('-')[0] : null;

  const lieuCode = raw.lieuExecution?.code || null;
  const dept = extractDepartement(lieuCode);
  const deptInfo = dept ? DEPT_MAP[dept] : null;

  const dateNotif = raw.dateNotification
    ? new Date(raw.dateNotification)
    : null;
  const datePub = raw.datePublicationDonnees
    ? new Date(raw.datePublicationDonnees)
    : null;

  return {
    objet: (raw.objet || 'Sans objet').slice(0, 500),
    acheteurNom: acheteurSiret ? `Acheteur ${acheteurSiret}` : 'Non renseigné',
    acheteurSiret,
    titulaireNom: titulaireSiret
      ? `Titulaire ${titulaireSiret}`
      : 'Non renseigné',
    titulaireSiret,
    titulaireCommune: null,
    montant: raw.montant != null ? Number(raw.montant) : null,
    dateNotification:
      dateNotif && !isNaN(dateNotif.getTime()) ? dateNotif : null,
    datePublicationDonnees:
      datePub && !isNaN(datePub.getTime()) ? datePub : null,
    nature: mapNatureFromText(raw.nature),
    procedure: raw.procedure || null,
    lieuExecution: lieuCode || null,
    departement: dept,
    departementNom: deptInfo?.name || null,
    region: deptInfo?.region || null,
    codeCPV,
    labelCPV: null,
    source: 'DECP-CONSOLIDE',
    sourceRef: `DECP-${raw.id || 'UNKNOWN'}-${titulaireSiret || 'NOTIT'}`.slice(
      0,
      250
    ),
    dureeMois: raw.dureeMois != null ? Number(raw.dureeMois) : null,
    formePrix: raw.formePrix || null,
  };
}

// ── Stream a DECP JSON file and process in batches ────────────────

export async function streamDecpFile(
  url: string,
  onBatch: (records: MarcheAttribueInput[]) => Promise<void>,
  batchSize = 500
): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  if (!res.body) {
    throw new Error(`No body in response from ${url}`);
  }

  // Convert Web ReadableStream to Node Readable
  const nodeStream = Readable.fromWeb(res.body as any);

  // JSON structure: { "marches": { "marche": [ {record}, ... ] } }
  // Use Pick to navigate to marches.marche, then StreamArray to iterate items
  const pipeline = nodeStream
    .pipe(parser())
    .pipe(pick({ filter: 'marches.marche' }))
    .pipe(streamArray());

  let batch: MarcheAttribueInput[] = [];
  let totalProcessed = 0;

  for await (const { value } of pipeline) {
    if (!value || typeof value !== 'object') continue;

    const raw = value as DecpRawRecord;
    if (!raw.id && !raw.objet) continue;

    // Extract titulaires — one record per titulaire
    const titulaires = raw.titulaires || [];
    if (titulaires.length === 0) {
      // No titulaire — create one record with unknown titulaire
      const mapped = mapDecpRecord(raw, { id: '', type: '' });
      batch.push(mapped);
    } else {
      for (const t of titulaires) {
        const tit = t.titulaire || t;
        const id = (tit as any).id || '';
        const type = (tit as any).typeIdentifiant || '';
        const mapped = mapDecpRecord(raw, { id: String(id), type: String(type) });
        batch.push(mapped);
      }
    }

    if (batch.length >= batchSize) {
      await onBatch(batch);
      totalProcessed += batch.length;
      batch = [];
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    await onBatch(batch);
    totalProcessed += batch.length;
  }

  return totalProcessed;
}
