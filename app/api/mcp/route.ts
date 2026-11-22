/**
 * Connecteur Claude (serveur MCP distant) — https://portal.abdridi.com/api/mcp
 *
 * Donne à Claude un accès EN LECTURE SEULE aux consultations ouvertes (avis
 * publics de la table "Marche"). Aucune donnée client n'est exposée.
 *
 * Authentification : clé secrète dans l'en-tête `Authorization: Bearer <clé>`
 * (variable d'environnement MCP_API_KEY). Sans clé configurée, l'accès est fermé.
 *
 * Voir docs/CONNECTEUR_CLAUDE.md pour la mise en service.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod4';
import { prisma } from '@/lib/prisma';
import {
  NATURES,
  SECTEUR_IDS,
  detailMarche,
  rechercherMarches,
  selectionSemaine,
  statistiquesVeille,
} from '@/lib/mcp-marches';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const secteurSchema = z.enum(SECTEUR_IDS as [string, ...string[]]);
const departementsSchema = z
  .array(z.string().min(1).max(3))
  .max(30)
  .describe('Codes de départements, ex. ["13","83","2A"].');

function texte(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 1) }] };
}

function erreur(message: string) {
  return { isError: true, content: [{ type: 'text' as const, text: message }] };
}

const LECTURE_SEULE = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const mcp = createMcpHandler(
  (server) => {
    server.registerTool(
      'rechercher_marches',
      {
        title: 'Rechercher des marchés publics ouverts',
        description:
          'Cherche dans la veille AB DRIDI les consultations ouvertes (avis publics, date limite non dépassée). ' +
          'Filtres combinables : mots-clés, secteur, départements, région, nature, acheteur, fraîcheur, délai restant, montant. ' +
          'Renvoie objet, acheteur, lieu, montant estimé, date limite, source et lien vers la fiche.',
        inputSchema: z.object({
          mots_cles: z.string().max(200).optional().describe('Mots-clés séparés par des virgules (logique OU), ex. "transport scolaire, navette".'),
          secteur: secteurSchema.optional().describe('Secteur prédéfini.'),
          departements: departementsSchema.optional(),
          region: z.string().max(60).optional().describe('Nom de région, ex. "Occitanie".'),
          nature: z.enum(NATURES).optional(),
          acheteur: z.string().max(120).optional().describe("Nom (partiel) de l'acheteur public."),
          publie_depuis_jours: z.number().int().min(1).max(365).optional().describe('Seulement les avis publiés depuis N jours.'),
          date_limite_dans_au_moins_jours: z.number().int().min(0).max(365).optional().describe('Seulement les avis dont la date limite est dans au moins N jours.'),
          montant_min: z.number().min(0).optional().describe('Montant estimé HT minimum, en euros.'),
          tri: z.enum(['recent', 'date_limite', 'montant']).optional().describe('recent (défaut), date_limite (la plus proche d\'abord) ou montant (le plus élevé d\'abord).'),
          limite: z.number().int().min(1).max(25).optional().describe('Nombre de résultats (défaut 10, maximum 25).'),
        }),
        annotations: LECTURE_SEULE,
      },
      async (args) => texte(await rechercherMarches(prisma, args as any)),
    );

    server.registerTool(
      'detail_marche',
      {
        title: "Détail d'un marché",
        description:
          "Fiche complète d'une consultation à partir de son identifiant (champ « id » renvoyé par les autres outils), avec la liste des documents publics.",
        inputSchema: z.object({ id: z.string().min(1).max(64) }),
        annotations: LECTURE_SEULE,
      },
      async ({ id }) => {
        const marche = await detailMarche(prisma, id);
        return marche ? texte(marche) : erreur('Marché introuvable.');
      },
    );

    server.registerTool(
      'selection_semaine',
      {
        title: 'Sélection des marchés de la semaine',
        description:
          'Pour chaque secteur (transport, nettoyage, informatique, restauration, bâtiment), renvoie les consultations publiées récemment ' +
          'dont la date limite est encore assez lointaine pour y répondre, classées par montant estimé. ' +
          'Sert à préparer la publication « marchés à ne pas rater ».',
        inputSchema: z.object({
          secteurs: z.array(secteurSchema).max(5).optional().describe('Par défaut : les 5 secteurs.'),
          par_secteur: z.number().int().min(1).max(5).optional().describe('Nombre de marchés par secteur (défaut 3).'),
          publie_depuis_jours: z.number().int().min(1).max(60).optional().describe('Défaut 7.'),
          date_limite_dans_au_moins_jours: z.number().int().min(0).max(120).optional().describe('Défaut 10.'),
          departements: departementsSchema.optional(),
          region: z.string().max(60).optional(),
        }),
        annotations: LECTURE_SEULE,
      },
      async (args) => texte(await selectionSemaine(prisma, args as any)),
    );

    server.registerTool(
      'statistiques_veille',
      {
        title: 'Chiffres de la veille',
        description:
          'Nombre de consultations ouvertes, publiées sur les 7 derniers jours, sources actives et répartition par nature.',
        inputSchema: z.object({}),
        annotations: LECTURE_SEULE,
      },
      async () => texte(await statistiquesVeille(prisma)),
    );
  },
  { serverInfo: { name: 'ab-dridi-veille', version: '1.0.0' } },
);

function empreinte(valeur: string): Buffer {
  return createHash('sha256').update(valeur).digest();
}

/** Comparaison à temps constant de la clé reçue avec MCP_API_KEY. */
function cleValide(req: Request, cleAttendue: string): boolean {
  const auth = req.headers.get('authorization') || '';
  const recue = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!recue) return false;
  return timingSafeEqual(empreinte(recue), empreinte(cleAttendue));
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
}

async function handler(req: Request): Promise<Response> {
  const cle = process.env.MCP_API_KEY;
  // Fermé par défaut : sans clé suffisamment longue, le connecteur ne répond pas.
  if (!cle || cle.length < 32) {
    return json(503, { error: 'Connecteur non configuré (MCP_API_KEY).' });
  }
  if (!cleValide(req, cle)) {
    return json(401, { error: 'Non autorisé.' }, { 'www-authenticate': 'Bearer realm="ab-dridi-veille"' });
  }
  return mcp(req);
}

export { handler as GET, handler as POST, handler as DELETE };
