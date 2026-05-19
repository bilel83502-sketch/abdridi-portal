/**
 * eu.eu-supply.com — EU Supply (CTM)
 *
 * NOTE : La plateforme nécessite une authentification pour accéder aux données.
 * Les URLs publiques testées (PublicRecords, open tenders) requièrent un login.
 * Ce fichier est un STUB qui retourne un tableau vide avec un avertissement.
 *
 * TODO : Implémenter le scraping si un accès public est découvert ou si des
 * credentials sont configurés via les variables d'environnement.
 */

/* ───── Type retour ───── */
export interface EuSupplyMarche {
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

const PUBLIC_URLS = [
  'https://eu.eu-supply.com/ctm/Supplier/PublicRecords/View',
  'https://eu.eu-supply.com/app/running/tenders/open',
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/* ───── Fonction principale ───── */
export async function fetchEuSupplyRecords(options?: {
  limit?: number;
}): Promise<EuSupplyMarche[]> {
  const _limit = options?.limit ?? 500;

  console.log(`[EU-SUPPLY] Attempting to access eu.eu-supply.com public pages...`);

  for (const url of PUBLIC_URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        redirect: 'follow',
      });

      // If we get redirected to a login page or get 401/403, skip
      if (res.status === 401 || res.status === 403) {
        console.warn(`[EU-SUPPLY] ${url} requires authentication (${res.status})`);
        continue;
      }

      if (res.ok) {
        const html = await res.text();
        // Check if it's a login page
        if (html.includes('login') && html.includes('password') && !html.includes('tender')) {
          console.warn(`[EU-SUPPLY] ${url} redirects to login page`);
          continue;
        }
        console.log(`[EU-SUPPLY] Got response from ${url} (${html.length} bytes) — parsing not yet implemented`);
      }
    } catch (err: any) {
      console.warn(`[EU-SUPPLY] Failed to access ${url}: ${err?.message}`);
    }
  }

  console.warn(`[EU-SUPPLY] No public data accessible — returning empty results. Authentication required.`);
  return [];
}
