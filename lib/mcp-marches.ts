/**
 * Connecteur Claude (MCP) — outils de lecture sur les consultations ouvertes.
 *
 * Règles de sécurité de ce module :
 *  - LECTURE SEULE : uniquement des SELECT.
 *  - Une seule table : "Marche" (avis publics). Aucun accès aux utilisateurs,
 *    alertes clients, prospects, missions ou documents de mission.
 *  - Toutes les valeurs passent en paramètres positionnels ($1, $2…), jamais
 *    concaténées dans le SQL.
 *  - Aucune écriture en base (pas de log, pas de rate-limit persistant) :
 *    la base Neon est proche de sa limite de stockage.
 */

import { TRANSPORT_CPV_PREFIXES } from './sectors';

/** Client minimal attendu : compatible avec PrismaClient. */
export interface RawDb {
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
}

export const PORTAL_URL = 'https://portal.abdridi.com';

/**
 * Secteurs proposés par le connecteur (sélection hebdomadaire LinkedIn).
 *
 * `cpv`  : préfixes de codes CPV (nomenclature hiérarchique gauche → droite).
 * `mots` : mots-clés cherchés dans le titre et le libellé CPV uniquement.
 * `natures` (optionnel) : restreint le secteur à certaines natures de marché.
 *
 * Volontairement plus strict que lib/sectors.ts : ici on veut de la précision
 * (un marché bien classé à montrer), pas du rappel. Ex. « scolaire » ou
 * « sanitaire » sont exclus car ils attrapent « groupe scolaire » (travaux)
 * ou « plomberie sanitaire ».
 */
export const SECTEURS = {
  transport: {
    label: 'Transport',
    cpv: TRANSPORT_CPV_PREFIXES,
    mots: [
      'transport', 'navette', 'autocar', 'autobus', 'tpmr', 'ambulance',
      'déménagement', 'demenagement', 'fret', 'coursier', 'taxi', 'voyageurs',
    ],
  },
  nettoyage: {
    label: 'Nettoyage',
    cpv: ['9091', '9061'],
    mots: ['nettoyage', 'propreté', 'proprete', 'entretien des locaux', 'vitrerie'],
  },
  informatique: {
    label: 'Informatique',
    cpv: ['72', '48', '302'],
    mots: [
      'informatique', 'logiciel', 'progiciel', 'cybersécurité', 'cybersecurite',
      'infogérance', 'infogerance', 'hébergement de données', 'tierce maintenance applicative',
    ],
  },
  restauration: {
    label: 'Restauration',
    cpv: ['553', '555', '15'],
    mots: [
      'restauration', 'repas', 'denrées', 'denrees', 'traiteur', 'cantine',
      'produits alimentaires',
    ],
  },
  batiment: {
    label: 'Bâtiment',
    // Travaux uniquement : sinon « nettoyage de bâtiments » (services) y entrerait.
    natures: ['TRAVAUX'],
    cpv: ['45'],
    mots: [
      'bâtiment', 'batiment', 'construction', 'réhabilitation', 'rehabilitation',
      'rénovation', 'renovation', 'gros œuvre', 'gros oeuvre', 'maçonnerie',
      'maconnerie', 'menuiserie', 'couverture', 'étanchéité', 'etancheite',
    ],
  },
} as const;

export type Secteur = keyof typeof SECTEURS;
export const SECTEUR_IDS = Object.keys(SECTEURS) as Secteur[];

export const NATURES = ['TRAVAUX', 'FOURNITURES', 'SERVICES'] as const;
export type Nature = (typeof NATURES)[number];

export type Tri = 'recent' | 'date_limite' | 'montant';

export interface RechercheArgs {
  mots_cles?: string;
  secteur?: Secteur;
  departements?: string[];
  region?: string;
  nature?: Nature;
  acheteur?: string;
  publie_depuis_jours?: number;
  date_limite_dans_au_moins_jours?: number;
  montant_min?: number;
  tri?: Tri;
  limite?: number;
}

const COLONNES = [
  'id', 'title', 'buyer', 'nature', 'department', '"departmentName"', 'region',
  'value', 'deadline', '"publicationDate"', 'source', '"sourceRef"',
  '"procedureType"', '"cpvCode"', '"cpvLabel"', 'lots', 'duration',
].join(', ');

const MS_JOUR = 24 * 60 * 60 * 1000;

function borne(n: unknown, min: number, max: number, defaut: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : defaut;
  return Math.max(min, Math.min(max, v));
}

/** Petit constructeur de clause WHERE à paramètres positionnels. */
class Where {
  conditions: string[] = [];
  params: any[] = [];

  /** Ajoute une valeur et renvoie son marqueur ($1, $2…). */
  p(value: any): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  add(condition: string) {
    this.conditions.push(condition);
  }

  sql(): string {
    return this.conditions.join(' AND ');
  }
}

function filtreSecteur(w: Where, secteur: Secteur) {
  const def: { cpv: readonly string[]; mots: readonly string[]; natures?: readonly string[] } =
    SECTEURS[secteur];
  if (def.natures && def.natures.length > 0) {
    w.add(`"nature" = ANY(${w.p([...def.natures])})`);
  }
  const clauses: string[] = [];
  for (const prefixe of def.cpv) {
    clauses.push(`"cpvCode" LIKE ${w.p(`${prefixe}%`)}`);
  }
  for (const mot of def.mots) {
    const m = w.p(`%${mot}%`);
    clauses.push(`"title" ILIKE ${m}`, `"cpvLabel" ILIKE ${m}`);
  }
  w.add(`(${clauses.join(' OR ')})`);
}

function construireWhere(args: RechercheArgs, maintenant: Date): Where {
  const w = new Where();
  w.add(`"status" = ${w.p('OUVERT')}`);

  // Jamais de marché dont la date limite est déjà passée.
  const joursMin = borne(args.date_limite_dans_au_moins_jours, 0, 365, 0);
  const limiteMin = new Date(maintenant.getTime() + joursMin * MS_JOUR);
  if (joursMin > 0) {
    w.add(`"deadline" IS NOT NULL AND "deadline" >= ${w.p(limiteMin)}`);
  } else {
    w.add(`("deadline" IS NULL OR "deadline" >= ${w.p(limiteMin)})`);
  }

  if (args.publie_depuis_jours !== undefined) {
    const jours = borne(args.publie_depuis_jours, 1, 365, 7);
    const depuis = new Date(maintenant.getTime() - jours * MS_JOUR);
    w.add(`"publicationDate" IS NOT NULL AND "publicationDate" >= ${w.p(depuis)}`);
  }

  if (args.secteur) filtreSecteur(w, args.secteur);

  if (args.mots_cles) {
    const mots = args.mots_cles.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
    if (mots.length > 0) {
      const clauses = mots.map((mot) => {
        const m = w.p(`%${mot}%`);
        return `"title" ILIKE ${m} OR "buyer" ILIKE ${m} OR "cpvLabel" ILIKE ${m}`;
      });
      w.add(`(${clauses.join(' OR ')})`);
    }
  }

  const departements = (args.departements || [])
    .map((d) => String(d).trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);
  if (departements.length > 0) w.add(`"department" = ANY(${w.p(departements)})`);

  if (args.region) w.add(`"region" ILIKE ${w.p(`%${args.region.trim()}%`)}`);
  if (args.nature) w.add(`"nature" = ${w.p(args.nature)}`);
  if (args.acheteur) w.add(`"buyer" ILIKE ${w.p(`%${args.acheteur.trim()}%`)}`);
  if (typeof args.montant_min === 'number' && args.montant_min > 0) {
    w.add(`"value" >= ${w.p(args.montant_min)}`);
  }

  return w;
}

function ordre(tri: Tri | undefined): string {
  switch (tri) {
    case 'date_limite':
      return `"deadline" ASC NULLS LAST, "id" DESC`;
    case 'montant':
      return `"value" DESC NULLS LAST, "publicationDate" DESC NULLS LAST, "id" DESC`;
    default:
      return `"publicationDate" DESC NULLS LAST, "id" DESC`;
  }
}

function jour(d: unknown): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** Mise en forme d'une ligne "Marche" pour Claude (clés en français). */
export function formater(m: any, maintenant: Date = new Date()) {
  const limite = m.deadline ? new Date(m.deadline) : null;
  const joursRestants =
    limite && !Number.isNaN(limite.getTime())
      ? Math.floor((limite.getTime() - maintenant.getTime()) / MS_JOUR)
      : null;
  return {
    id: m.id,
    objet: m.title,
    acheteur: m.buyer,
    nature: m.nature,
    departement: m.department,
    departement_nom: m.departmentName ?? null,
    region: m.region ?? null,
    montant_estime_ht: typeof m.value === 'number' ? m.value : null,
    date_limite: jour(m.deadline),
    jours_restants: joursRestants,
    publie_le: jour(m.publicationDate),
    source: m.source,
    reference: m.sourceRef ?? null,
    procedure: m.procedureType ?? null,
    cpv: m.cpvCode ?? null,
    cpv_libelle: m.cpvLabel ?? null,
    lots: m.lots ?? null,
    duree: m.duration ?? null,
    lien: `${PORTAL_URL}/marches/${m.id}`,
  };
}

/** Recherche de consultations ouvertes. */
export async function rechercherMarches(db: RawDb, args: RechercheArgs, maintenant = new Date()) {
  const limite = borne(args.limite, 1, 25, 10);
  const w = construireWhere(args, maintenant);

  const [lignes, compte] = await Promise.all([
    db.$queryRawUnsafe(
      `SELECT ${COLONNES} FROM "Marche" WHERE ${w.sql()} ORDER BY ${ordre(args.tri)} LIMIT ${limite}`,
      ...w.params,
    ) as Promise<any[]>,
    db.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "Marche" WHERE ${w.sql()}`,
      ...w.params,
    ) as Promise<{ count: number }[]>,
  ]);

  return {
    total: compte[0]?.count ?? 0,
    affiches: lignes.length,
    marches: lignes.map((m) => formater(m, maintenant)),
  };
}

/** Détail complet d'une consultation (avec la liste des documents publics). */
export async function detailMarche(db: RawDb, id: string, maintenant = new Date()) {
  const lignes = (await db.$queryRawUnsafe(
    `SELECT ${COLONNES}, documents, status FROM "Marche" WHERE id = $1 LIMIT 1`,
    id,
  )) as any[];
  const m = lignes[0];
  if (!m) return null;
  const documents = Array.isArray(m.documents)
    ? m.documents.slice(0, 40).map((d: any) => ({ nom: d?.name ?? null, url: d?.url ?? null, type: d?.type ?? null }))
    : [];
  return { ...formater(m, maintenant), statut: m.status, documents };
}

export interface SelectionArgs {
  secteurs?: Secteur[];
  par_secteur?: number;
  publie_depuis_jours?: number;
  date_limite_dans_au_moins_jours?: number;
  departements?: string[];
  region?: string;
}

/**
 * Sélection de la semaine : pour chaque secteur, les consultations récentes
 * dont la date limite est encore assez lointaine pour être utiles.
 * Classement : montant estimé décroissant, puis publication la plus récente.
 */
export async function selectionSemaine(db: RawDb, args: SelectionArgs, maintenant = new Date()) {
  const secteurs = (args.secteurs && args.secteurs.length > 0 ? args.secteurs : SECTEUR_IDS).filter(
    (s, i, a) => SECTEUR_IDS.includes(s) && a.indexOf(s) === i,
  );
  const parSecteur = borne(args.par_secteur, 1, 5, 3);
  const publieDepuis = borne(args.publie_depuis_jours, 1, 60, 7);
  const delaiMin = borne(args.date_limite_dans_au_moins_jours, 0, 120, 10);

  const resultats = await Promise.all(
    secteurs.map(async (secteur) => {
      const w = construireWhere(
        {
          secteur,
          publie_depuis_jours: publieDepuis,
          date_limite_dans_au_moins_jours: delaiMin,
          departements: args.departements,
          region: args.region,
        },
        maintenant,
      );
      // On en prend un peu plus pour pouvoir dédoublonner entre secteurs.
      const lignes = (await db.$queryRawUnsafe(
        `SELECT ${COLONNES} FROM "Marche" WHERE ${w.sql()} ORDER BY ${ordre('montant')} LIMIT ${parSecteur + 5}`,
        ...w.params,
      )) as any[];
      return { secteur, lignes };
    }),
  );

  const dejaVus = new Set<string>();
  const selection = resultats.map(({ secteur, lignes }) => {
    const retenus: any[] = [];
    for (const m of lignes) {
      if (retenus.length >= parSecteur) break;
      if (dejaVus.has(m.id)) continue;
      dejaVus.add(m.id);
      retenus.push(formater(m, maintenant));
    }
    return { secteur, libelle: SECTEURS[secteur].label, marches: retenus };
  });

  return {
    criteres: {
      publie_depuis_jours: publieDepuis,
      date_limite_dans_au_moins_jours: delaiMin,
      par_secteur: parSecteur,
    },
    selection,
  };
}

/** Chiffres de la veille (consultations ouvertes uniquement). */
export async function statistiquesVeille(db: RawDb, maintenant = new Date()) {
  const il7j = new Date(maintenant.getTime() - 7 * MS_JOUR);
  const [global, parNature] = await Promise.all([
    db.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS ouverts,
              COUNT(*) FILTER (WHERE "publicationDate" >= $2)::int AS publies_7_jours,
              COUNT(DISTINCT "source")::int AS sources,
              MAX("publicationDate") AS derniere_publication
         FROM "Marche"
        WHERE "status" = $1 AND ("deadline" IS NULL OR "deadline" >= $3)`,
      'OUVERT',
      il7j,
      maintenant,
    ) as Promise<any[]>,
    db.$queryRawUnsafe(
      `SELECT "nature", COUNT(*)::int AS count
         FROM "Marche"
        WHERE "status" = $1 AND ("deadline" IS NULL OR "deadline" >= $2)
        GROUP BY "nature" ORDER BY count DESC LIMIT 10`,
      'OUVERT',
      maintenant,
    ) as Promise<{ nature: string; count: number }[]>,
  ]);
  const g = global[0] || {};
  return {
    consultations_ouvertes: g.ouverts ?? 0,
    publiees_7_derniers_jours: g.publies_7_jours ?? 0,
    sources_actives: g.sources ?? 0,
    derniere_publication: jour(g.derniere_publication),
    par_nature: parNature.map((n) => ({ nature: n.nature, nombre: n.count })),
  };
}
