/**
 * aji-france.com (AJI) — Plateforme de dématérialisation
 *
 * NOTE : La plateforme bloque les requêtes curl/bot (pas de réponse HTTP).
 * Ce fichier tente l'accès avec des headers complets et, en cas d'échec,
 * retourne un tableau vide avec un avertissement.
 *
 * TODO : Implémenter le parsing si l'accès devient possible (ex: via un proxy
 * ou si la plateforme change sa politique anti-bot).
 */

import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const ACCESS_URLS = [
  'https://www.aji-france.com/aji/acces-public.html',
  'https://www.aji-france.com/',
];

/* ───── Type retour ───── */
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

/* ───── Fonction principale ───── */
export async function fetchAjiRecords(options?: {
  limit?: number;
}): Promise<AjiMarche[]> {
  const _limit = options?.limit ?? 500;

  console.log(`[AJI] Attempting to access aji-france.com...`);

  for (const url of ACCESS_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        // Check if we got actual content (not a block page)
        const bodyText = $('body').text().trim();
        if (bodyText.length < 100) {
          console.warn(`[AJI] ${url} returned minimal content — likely blocked`);
          continue;
        }

        console.log(`[AJI] Got response from ${url} (${html.length} bytes)`);
        // TODO: Parse actual tender data when access is available
      } else {
        console.warn(`[AJI] ${url} returned ${res.status}`);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.warn(`[AJI] ${url} timed out (15s) — site likely blocking bots`);
      } else {
        console.warn(`[AJI] Failed to access ${url}: ${err?.message}`);
      }
    }
  }

  console.warn(`[AJI] Site blocks automated access — returning empty results`);
  return [];
}
