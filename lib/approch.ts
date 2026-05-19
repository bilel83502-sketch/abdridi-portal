/**
 * approch.fr (APProch) — Plateforme de marchés publics
 *
 * NOTE : Le domaine approch.fr est actuellement parkiné (en vente sur Dovendi)
 * au 2026-03-19. Ce fichier est un STUB qui retourne un tableau vide.
 *
 * TODO : Implémenter le scraping quand le domaine sera de nouveau opérationnel.
 */

/* ───── Type retour ───── */
export interface ApprochMarche {
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

/* ───── Fonction principale ───── */
export async function fetchApprochRecords(options?: {
  limit?: number;
}): Promise<ApprochMarche[]> {
  void options;
  console.warn(`[APPROCH] Le domaine approch.fr est parkiné (en vente sur Dovendi) — aucune donnée disponible`);
  return [];
}
