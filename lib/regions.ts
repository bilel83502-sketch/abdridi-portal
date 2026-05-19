/**
 * Mapping département → région + slug pour les logos régionaux.
 */

export interface RegionInfo {
  name: string;
  slug: string;
}

const REGION_MAP: Record<string, RegionInfo> = {};

const REGIONS: { name: string; slug: string; depts: string[] }[] = [
  {
    name: 'Île-de-France',
    slug: 'ile-de-france',
    depts: ['75', '77', '78', '91', '92', '93', '94', '95'],
  },
  {
    name: 'Provence-Alpes-Côte d\'Azur',
    slug: 'paca',
    depts: ['04', '05', '06', '13', '83', '84'],
  },
  {
    name: 'Auvergne-Rhône-Alpes',
    slug: 'auvergne-rhone-alpes',
    depts: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  },
  {
    name: 'Occitanie',
    slug: 'occitanie',
    depts: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  },
  {
    name: 'Nouvelle-Aquitaine',
    slug: 'nouvelle-aquitaine',
    depts: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  },
  {
    name: 'Grand Est',
    slug: 'grand-est',
    depts: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  },
  {
    name: 'Hauts-de-France',
    slug: 'hauts-de-france',
    depts: ['02', '59', '60', '62', '80'],
  },
  {
    name: 'Bretagne',
    slug: 'bretagne',
    depts: ['22', '29', '35', '56'],
  },
  {
    name: 'Normandie',
    slug: 'normandie',
    depts: ['14', '27', '50', '61', '76'],
  },
  {
    name: 'Pays de la Loire',
    slug: 'pays-de-la-loire',
    depts: ['44', '49', '53', '72', '85'],
  },
  {
    name: 'Centre-Val de Loire',
    slug: 'centre-val-de-loire',
    depts: ['18', '28', '36', '37', '41', '45'],
  },
  {
    name: 'Bourgogne-Franche-Comté',
    slug: 'bourgogne-franche-comte',
    depts: ['21', '25', '39', '58', '70', '71', '89', '90'],
  },
  {
    name: 'Corse',
    slug: 'corse',
    depts: ['2A', '2B'],
  },
  {
    name: 'Guadeloupe',
    slug: 'guadeloupe',
    depts: ['971'],
  },
  {
    name: 'Martinique',
    slug: 'martinique',
    depts: ['972'],
  },
  {
    name: 'Guyane',
    slug: 'guyane',
    depts: ['973'],
  },
  {
    name: 'La Réunion',
    slug: 'la-reunion',
    depts: ['974'],
  },
  {
    name: 'Mayotte',
    slug: 'mayotte',
    depts: ['976'],
  },
];

// Build flat lookup
for (const r of REGIONS) {
  for (const d of r.depts) {
    REGION_MAP[d] = { name: r.name, slug: r.slug };
  }
}

/**
 * Normalize department codes to match the mapping.
 * Handles: "6" → "06", "20A" → "2A", "20B" → "2B", etc.
 */
export function normalizeDept(dept: string): string {
  const d = dept.trim();
  // 20A/20B → 2A/2B (old Corse variants)
  if (d === '20A') return '2A';
  if (d === '20B') return '2B';
  if (d === '20') return '2A'; // old unified Corse code → default to 2A
  // Single digit → zero-padded (1→01, 6→06, etc.)
  if (/^\d$/.test(d)) return d.padStart(2, '0');
  // Three digits starting with 0 → strip leading zero (020→02, 060→06)
  if (/^0\d{2}$/.test(d)) return d.slice(1);
  return d;
}

/**
 * Returns the region logo path for a given department code.
 * Falls back to /logo.png if department is unknown.
 */
export function getRegionLogo(department: string | null | undefined): string {
  if (!department || department === '00' || department === 'nan') return '/regions/france.png';
  const normalized = normalizeDept(department);
  const region = REGION_MAP[normalized];
  if (!region) return '/regions/france.png';
  return `/regions/${region.slug}.png`;
}

export { REGION_MAP, REGIONS };
