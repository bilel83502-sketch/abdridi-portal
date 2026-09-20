/**
 * Cantons suisses — utilisés comme "départements" dans le modèle Marche
 * (code CH-XX) pour que les filtres, les logos et les alertes fonctionnent
 * sans changer le schéma. Région = "Suisse".
 */

export interface Canton {
  /** Code interne stocké dans Marche.department, ex: "CH-GE" */
  code: string;
  /** Identifiant canton utilisé par simap.ch (cantonId), ex: "GE" */
  id: string;
  /** Nom en français */
  name: string;
  /** Codes NUTS-3 (TED) correspondant au canton */
  nuts: string[];
}

export const CANTONS: Canton[] = [
  { code: 'CH-AG', id: 'AG', name: 'Argovie',                nuts: ['CH033'] },
  { code: 'CH-AI', id: 'AI', name: 'Appenzell Rh.-Int.',     nuts: ['CH054'] },
  { code: 'CH-AR', id: 'AR', name: 'Appenzell Rh.-Ext.',     nuts: ['CH053'] },
  { code: 'CH-BE', id: 'BE', name: 'Berne',                  nuts: ['CH021'] },
  { code: 'CH-BL', id: 'BL', name: 'Bâle-Campagne',          nuts: ['CH032'] },
  { code: 'CH-BS', id: 'BS', name: 'Bâle-Ville',             nuts: ['CH031'] },
  { code: 'CH-FR', id: 'FR', name: 'Fribourg',               nuts: ['CH022'] },
  { code: 'CH-GE', id: 'GE', name: 'Genève',                 nuts: ['CH013'] },
  { code: 'CH-GL', id: 'GL', name: 'Glaris',                 nuts: ['CH051'] },
  { code: 'CH-GR', id: 'GR', name: 'Grisons',                nuts: ['CH056'] },
  { code: 'CH-JU', id: 'JU', name: 'Jura',                   nuts: ['CH025'] },
  { code: 'CH-LU', id: 'LU', name: 'Lucerne',                nuts: ['CH061'] },
  { code: 'CH-NE', id: 'NE', name: 'Neuchâtel',              nuts: ['CH024'] },
  { code: 'CH-NW', id: 'NW', name: 'Nidwald',                nuts: ['CH065'] },
  { code: 'CH-OW', id: 'OW', name: 'Obwald',                 nuts: ['CH064'] },
  { code: 'CH-SG', id: 'SG', name: 'Saint-Gall',             nuts: ['CH055'] },
  { code: 'CH-SH', id: 'SH', name: 'Schaffhouse',            nuts: ['CH052'] },
  { code: 'CH-SO', id: 'SO', name: 'Soleure',                nuts: ['CH023'] },
  { code: 'CH-SZ', id: 'SZ', name: 'Schwyz',                 nuts: ['CH063'] },
  { code: 'CH-TG', id: 'TG', name: 'Thurgovie',              nuts: ['CH057'] },
  { code: 'CH-TI', id: 'TI', name: 'Tessin',                 nuts: ['CH070'] },
  { code: 'CH-UR', id: 'UR', name: 'Uri',                    nuts: ['CH062'] },
  { code: 'CH-VD', id: 'VD', name: 'Vaud',                   nuts: ['CH011'] },
  { code: 'CH-VS', id: 'VS', name: 'Valais',                 nuts: ['CH012'] },
  { code: 'CH-ZG', id: 'ZG', name: 'Zoug',                   nuts: ['CH066'] },
  { code: 'CH-ZH', id: 'ZH', name: 'Zurich',                 nuts: ['CH040'] },
];

export const SUISSE_REGION = 'Suisse';

/** Canton "national / non précisé" : marchés fédéraux ou sans lieu identifiable. */
export const CANTON_CH_UNKNOWN = { code: 'CH', name: 'Suisse (national)' };

const BY_ID: Record<string, Canton> = {};
const BY_NUTS: Record<string, Canton> = {};
for (const c of CANTONS) {
  BY_ID[c.id] = c;
  for (const n of c.nuts) BY_NUTS[n] = c;
}

/** Depuis un cantonId simap ("GE") ou un code interne ("CH-GE"). */
export function cantonFromId(id: string | null | undefined): Canton | null {
  if (!id) return null;
  const k = id.toUpperCase().replace(/^CH-/, '');
  return BY_ID[k] || null;
}

/** Depuis une liste de codes NUTS TED (CH011, CH0, CH…). */
export function cantonFromNuts(codes: string[]): Canton | null {
  for (const code of codes || []) {
    if (!code.startsWith('CH')) continue;
    if (BY_NUTS[code]) return BY_NUTS[code];
  }
  return null;
}
