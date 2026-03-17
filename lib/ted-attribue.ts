/**
 * Scraper TED Contract Award Notices — marchés UE attribués en France
 * API publique : https://ted.europa.eu/api/v3.0/notices/search
 */

import { type AttribueRecord } from './decp-attribue';

const TED_API = 'https://ted.europa.eu/api/v3.0/notices/search';

function mapNature(cpvCode: string | null): string {
  if (!cpvCode) return 'SERVICES';
  const prefix = cpvCode.slice(0, 2);
  // CPV 45 = travaux, 30-44 = fournitures
  if (prefix === '45') return 'TRAVAUX';
  if (parseInt(prefix) >= 30 && parseInt(prefix) <= 44) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const nd = r['ND'] || r['notice-id'] || r['id'];
  if (!nd) return null;

  const title = r['TI'] || r['title-text'] || r['object-contract-title'] || '';
  const buyerName = r['CA_NAME'] || r['contracting-authority-name'] || r['buyer-name'] || '';
  const winnerName = r['WIN_NAME'] || r['winner-name'] || r['contractor-name'] || '';
  const value = r['AC_VALUE'] || r['award-value'] || r['total-value'] || null;
  const cpv = r['CP_CODE'] || r['cpv-code'] || null;
  const date = r['DT_DATE_FOR_SUBMISSION'] || r['award-date'] || r['dispatch-date'] || null;

  if (!title && !winnerName) return null;

  return {
    objet: (title || 'Marché UE').slice(0, 500),
    acheteurNom: buyerName || 'Non renseigné',
    acheteurSiret: null,
    titulaireNom: winnerName || 'Non renseigné',
    titulaireSiret: null,
    titulaireCommune: null,
    montant: value ? parseFloat(String(value)) : null,
    dateNotification: date ? new Date(date) : null,
    datePublicationDonnees: null,
    nature: mapNature(cpv),
    procedure: null,
    lieuExecution: 'France',
    departement: null,
    departementNom: null,
    region: null,
    codeCPV: cpv || null,
    labelCPV: null,
    source: 'TED',
    sourceRef: `TED-ATT-${nd}`.slice(0, 250),
    dureeMois: null,
    formePrix: null,
  };
}

export async function fetchTedAttribueBatch(options: {
  limit: number;
  page: number;
}): Promise<AttribueRecord[]> {
  const { limit, page } = options;
  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  const pageSize = 100;
  let currentPage = page;
  const maxPages = Math.ceil(limit / pageSize);

  for (let i = 0; i < maxPages && allRecords.length < limit; i++) {
    const body = {
      query: 'ND=[CAN] AND PC=[FR]',
      fields: [
        'ND', 'TI', 'CA_NAME', 'WIN_NAME', 'WIN_COUNTRY',
        'AC_VALUE', 'DT_DATE_FOR_SUBMISSION', 'PC_CODE', 'CP_CODE',
      ],
      page: currentPage,
      limit: pageSize,
    };

    console.log(`[TED-ATT] Fetching page=${currentPage}...`);

    try {
      const res = await fetch(TED_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[TED-ATT] API error ${res.status}: ${text.slice(0, 300)}`);
        // Try alternate API with apiKey if available
        if (process.env.TED_API_KEY) {
          const altRes = await fetch('https://api.ted.europa.eu/v3/notices/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              apiKey: process.env.TED_API_KEY,
            },
            body: JSON.stringify(body),
          });
          if (!altRes.ok) {
            console.error(`[TED-ATT] Alt API also failed: ${altRes.status}`);
            break;
          }
          const altJson = await altRes.json();
          const results = altJson.results || altJson.notices || altJson.data || [];
          if (results.length === 0) break;
          for (const r of results) {
            const mapped = mapRecord(r);
            if (mapped && !seenRefs.has(mapped.sourceRef)) {
              seenRefs.add(mapped.sourceRef);
              allRecords.push(mapped);
            }
          }
        } else {
          break;
        }
      } else {
        const json = await res.json();
        const results = json.results || json.notices || json.data || [];
        if (results.length === 0) break;

        for (const r of results) {
          const mapped = mapRecord(r);
          if (mapped && !seenRefs.has(mapped.sourceRef)) {
            seenRefs.add(mapped.sourceRef);
            allRecords.push(mapped);
          }
        }

        if (results.length < pageSize) break;
      }
    } catch (err: any) {
      console.error(`[TED-ATT] Fetch error: ${err.message}`);
      break;
    }

    currentPage++;
  }

  console.log(`[TED-ATT] Batch: ${allRecords.length} records`);
  return allRecords;
}
