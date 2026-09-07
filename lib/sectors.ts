/**
 * Mapping centralisé secteur → CPV + mots-clés.
 *
 * Source unique de vérité pour qualifier un marché public comme appartenant
 * à un secteur d'activité (Transport, BTP, Services, etc.).
 *
 * Utilisé par :
 *  - le filtre Concurrence (statistiques sectorielles)
 *  - les alertes utilisateurs (matching keywords + CPV)
 *  - les exports CSV sectoriels
 *
 * Élargissement Sprint 1 Acquisition (mai 2026) :
 * la définition "Transport" passe de CPV 60.x seul à 60.x + 34.x + 50.1x + 63.x
 * + mots-clés étendus (navette, autocar, TPMR, ambulance, déménagement, fret,
 * coursier, livraison, logistique, sanitaire, scolaire). Cible : +250 AO.
 */

/**
 * Préfixes CPV (2 à 4 premiers chiffres) considérés comme "Transport" au sens
 * AB DRIDI / La Centrale des Marchés. Un code CPV matche s'il commence par
 * l'un de ces préfixes (la nomenclature CPV est hiérarchique gauche-à-droite).
 *
 * Familles incluses :
 *  - 60.x  : Services de transport (passagers, marchandises, terre/eau/air)
 *  - 34.x  : Équipement de transport (véhicules, pièces, accessoires)
 *  - 50.1x : Réparation et entretien de véhicules à moteur
 *  - 50.2x : Réparation et entretien d'aéronefs / ferroviaire / navires
 *  - 63.x  : Services auxiliaires de transport (logistique, entreposage,
 *            manutention, agences voyage)
 */
export const TRANSPORT_CPV_PREFIXES: readonly string[] = [
  // Services transport (cœur historique)
  '60',
  // Équipement transport
  '34',
  // Réparation / entretien véhicules
  '5011', '5012', '5013', '5014', '5015', '5016', '5017', '5018',
  '5021', '5022', '5023', '5024', '5025',
  // Services auxiliaires (logistique, entreposage, agences voyage, manutention)
  '63',
];

/**
 * Mots-clés étendus pour qualifier "Transport" depuis le titre, l'objet ou
 * l'acheteur d'un marché. Tout est en minuscules, le matching doit être
 * insensible à la casse (ILIKE / contains insensitive).
 *
 * Couvre les sous-segments majeurs du marché transport public :
 *  - voyageurs : navette, autocar, scolaire, TPMR, taxi
 *  - sanitaire : ambulance, VSL, sanitaire
 *  - marchandises : fret, coursier, livraison, déménagement, messagerie
 *  - support : logistique, entreposage, affrètement
 */
export const TRANSPORT_KEYWORDS: readonly string[] = [
  'transport',
  'navette',
  'autocar',
  'autobus',
  'tpmr',
  'ambulance',
  'vsl',
  'sanitaire',
  'scolaire',
  'déménagement',
  'demenagement',
  'fret',
  'coursier',
  'livraison',
  'logistique',
  'messagerie',
  'affrètement',
  'affretement',
  'taxi',
  'voyageurs',
  'véhicule',
  'vehicule',
  'flotte',
  'transit',
  'entreposage',
];

/**
 * Détermine si un code CPV (chaîne brute, ex "60130000-8" ou "60130000")
 * relève du secteur transport élargi.
 */
export function isTransportCpv(cpv: string | null | undefined): boolean {
  if (!cpv) return false;
  // Normaliser : enlever tirets / espaces / suffixe contrôle
  const clean = cpv.replace(/[^0-9]/g, '');
  if (!clean) return false;
  return TRANSPORT_CPV_PREFIXES.some((p) => clean.startsWith(p));
}

/**
 * Détermine si un texte libre (titre, objet, acheteur) contient un
 * mot-clé transport. Matching insensible à la casse.
 */
export function hasTransportKeyword(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return TRANSPORT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Qualifie un marché (titre + acheteur + cpvCode + cpvLabel) comme transport.
 * Un marché est transport si AU MOINS UN des champs matche soit un préfixe
 * CPV transport, soit un mot-clé transport.
 */
export function isTransportMarche(m: {
  title?: string | null;
  buyer?: string | null;
  cpvCode?: string | null;
  cpvLabel?: string | null;
}): boolean {
  return (
    isTransportCpv(m.cpvCode) ||
    hasTransportKeyword(m.title) ||
    hasTransportKeyword(m.buyer) ||
    hasTransportKeyword(m.cpvLabel)
  );
}

/**
 * Fragment SQL Postgres prêt à l'emploi pour filtrer la table "Marche" sur le
 * secteur transport élargi. À injecter dans une clause WHERE existante avec AND.
 *
 * Utilise des paramètres positionnels en partant de `startIdx` (1-based) ; la
 * fonction retourne le SQL et le tableau de paramètres à concaténer aux params
 * existants de la query.
 *
 * Exemple :
 *   const { sql, params } = buildTransportSqlFilter(paramIdx);
 *   conditions.push(sql);
 *   queryParams.push(...params);
 *   paramIdx += params.length;
 */
export function buildTransportSqlFilter(startIdx: number): {
  sql: string;
  params: string[];
} {
  const params: string[] = [];
  const cpvClauses: string[] = [];
  for (const prefix of TRANSPORT_CPV_PREFIXES) {
    cpvClauses.push(`"cpvCode" LIKE $${startIdx + params.length}`);
    params.push(`${prefix}%`);
  }
  const kwClauses: string[] = [];
  for (const kw of TRANSPORT_KEYWORDS) {
    const idx = startIdx + params.length;
    kwClauses.push(
      `("title" ILIKE $${idx} OR "buyer" ILIKE $${idx} OR "cpvLabel" ILIKE $${idx})`,
    );
    params.push(`%${kw}%`);
  }
  const sql = `((${cpvClauses.join(' OR ')}) OR (${kwClauses.join(' OR ')}))`;
  return { sql, params };
}
