import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const INGEST_SECRET = process.env.INGEST_SECRET ?? "change-me-in-vercel-env";
const BOAMP_API = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";

interface RawTender {
  sourceKey: string;
  sourceNoticeId: string;
  title: string;
  description?: string;
  officialUrl?: string;
  buyerName?: string;
  buyerSiret?: string;
  cpvCodes?: string[];
  regionCode?: string;
  departmentCode?: string;
  estimatedValue?: number;
  currency?: string;
  procedureType?: string;
  status?: string;
  publishedAt?: Date;
  deadline?: Date;
  documents?: {
    type?: string;
    label?: string;
    url: string;
  }[];
}

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("x-ingest-secret") === INGEST_SECRET;
}

// =============================================================================
// POST /api/ingest
// =============================================================================

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { inserted: number; updated: number; errors: number }> = {};

  const enabledSources = await prisma.sourceRegistry.findMany({
    where: { enabled: true },
  });

  const sourceKeys = new Set(enabledSources.map((s) => s.key.toLowerCase()));

  if (sourceKeys.has("boamp")) {
    results["boamp"] = await ingestBOAMP();
  }

  if (sourceKeys.has("place")) {
    results["place"] = await ingestPLACE();
  }

  if (sourceKeys.has("ted")) {
    results["ted"] = await ingestTED();
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}

// =============================================================================
// GET /api/ingest — pour Vercel Cron
// =============================================================================

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  const headerSecret = req.headers.get("x-ingest-secret");

  if (headerSecret !== INGEST_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: { "x-ingest-secret": INGEST_SECRET },
  });
  return POST(fakeReq);
}

// =============================================================================
// BOAMP — Bulletin Officiel des Annonces des Marchés Publics
// =============================================================================

async function ingestBOAMP() {
  const stats = { inserted: 0, updated: 0, errors: 0 };

  try {
    const url = new URL(BOAMP_API);
    url.searchParams.set("limit", "100");
    url.searchParams.set("order_by", "dateparution DESC");
    url.searchParams.set("where", "nature = 'AVIS_MARCHE' OR nature = 'AVIS_APPEL_OFFRE'");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[BOAMP] HTTP " + res.status);
      stats.errors++;
      return stats;
    }

    const data = await res.json();
    const records: any[] = data.results ?? data.records ?? [];

    for (const record of records) {
      try {
        const fields = record.fields ?? record;
        const raw = mapBOAMPToRaw(fields);
        if (!raw) continue;
        await upsertTender(raw);
        stats.inserted++;
      } catch (err) {
        console.error("[BOAMP] record error:", err);
        stats.errors++;
      }
    }
  } catch (err) {
    console.error("[BOAMP] fetch error:", err);
    stats.errors++;
  }

  return stats;
}

function mapBOAMPToRaw(f: any): RawTender | null {
  const id = f.idweb ?? f.id ?? f.identifiant;
  if (!id) return null;

  let cpvCodes: string[] = [];
  if (f.code_cpv) {
    cpvCodes = String(f.code_cpv).split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  }

  const officialUrl = f.url_avis ?? (id ? "https://www.boamp.fr/avis/detail/" + id : undefined);

  return {
    sourceKey: "boamp",
    sourceNoticeId: String(id),
    title: f.objet ?? f.intitule ?? "Avis BOAMP " + id,
    description: f.descripteurs ?? f.objet ?? undefined,
    officialUrl,
    buyerName: f.nomacheteur ?? f.denomination ?? undefined,
    buyerSiret: f.siret ?? undefined,
    cpvCodes,
    departmentCode: f.dept ? String(f.dept) : undefined,
    regionCode: f.region ?? undefined,
    procedureType: f.nature ?? undefined,
    status: "open",
    publishedAt: f.dateparution ? new Date(f.dateparution) : undefined,
    deadline: f.datelimitereponse ? new Date(f.datelimitereponse) : undefined,
  };
}

// =============================================================================
// PLACE — Plateforme des Achats de l'État
// =============================================================================

async function ingestPLACE() {
  const stats = { inserted: 0, updated: 0, errors: 0 };

  try {
    const PLACE_ATOM = "https://www.marches-publics.gouv.fr/app.php/consultation/flux/atom";

    const res = await fetch(PLACE_ATOM, {
      headers: { Accept: "application/atom+xml, application/xml, text/xml" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[PLACE] HTTP " + res.status);
      stats.errors++;
      return stats;
    }

    const text = await res.text();
    const entries = text.split("<entry>").slice(1);

    for (const entry of entries.slice(0, 100)) {
      try {
        const raw = parsePLACEEntry(entry);
        if (!raw) continue;
        await upsertTender(raw);
        stats.inserted++;
      } catch (err) {
        console.error("[PLACE] entry error:", err);
        stats.errors++;
      }
    }
  } catch (err) {
    console.error("[PLACE] fetch error:", err);
    stats.errors++;
  }

  return stats;
}

function parsePLACEEntry(xml: string): RawTender | null {
  const extract = (tag: string): string | undefined => {
    const match = xml.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
    return match ? match[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1") : undefined;
  };

  const id = extract("id");
  const title = extract("title");
  if (!id || !title) return null;

  const linkMatch = xml.match(/<link[^>]+href="([^"]+)"/);
  const officialUrl = linkMatch ? linkMatch[1] : undefined;
  const published = extract("published") ?? extract("updated");

  return {
    sourceKey: "place",
    sourceNoticeId: id,
    title,
    description: extract("summary") ?? extract("content"),
    officialUrl,
    status: "open",
    publishedAt: published ? new Date(published) : undefined,
  };
}

// =============================================================================
// TED — Tenders Electronic Daily (Europe)
// =============================================================================

async function ingestTED() {
  const stats = { inserted: 0, updated: 0, errors: 0 };

  try {
    const TED_SEARCH = "https://ted.europa.eu/api/v3.0/notices/search";

    const body = {
      query: "buyer-country:FRA",
      pageSize: 50,
      pageNum: 1,
      sortField: "publication-date",
      sortOrder: "DESC",
    };

    const res = await fetch(TED_SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[TED] HTTP " + res.status);
      stats.errors++;
      return stats;
    }

    const data = await res.json();
    const notices: any[] = data.notices ?? data.results ?? [];

    for (const n of notices) {
      try {
        const raw = mapTEDToRaw(n);
        if (!raw) continue;
        await upsertTender(raw);
        stats.inserted++;
      } catch (err) {
        console.error("[TED] notice error:", err);
        stats.errors++;
      }
    }
  } catch (err) {
    console.error("[TED] fetch error:", err);
    stats.errors++;
  }

  return stats;
}

function mapTEDToRaw(n: any): RawTender | null {
  const id = n["notice-id"] ?? n.id ?? n.docId;
  if (!id) return null;

  let cpvCodes: string[] = [];
  if (n["cpv-code"]) {
    cpvCodes = Array.isArray(n["cpv-code"])
      ? n["cpv-code"].map(String)
      : [String(n["cpv-code"])];
  }

  return {
    sourceKey: "ted",
    sourceNoticeId: String(id),
    title: n.title ?? n["title-fra"] ?? "TED " + id,
    description: n["short-description"] ?? undefined,
    officialUrl: "https://ted.europa.eu/notice/" + id,
    buyerName: n["buyer-name"] ?? undefined,
    cpvCodes,
    procedureType: n["procedure-type"] ?? undefined,
    status: "open",
    publishedAt: n["publication-date"] ? new Date(n["publication-date"]) : undefined,
    deadline: n["deadline-date"] ? new Date(n["deadline-date"]) : undefined,
    estimatedValue: n["total-value"] ? Number(n["total-value"]) : undefined,
    currency: n.currency ?? "EUR",
  };
}

// =============================================================================
// Upsert générique — idempotent sur (sourceKey + sourceNoticeId)
// =============================================================================

async function upsertTender(raw: RawTender) {
  const upserted = await prisma.tenderNotice.upsert({
    where: {
      sourceKey_sourceNoticeId: {
        sourceKey: raw.sourceKey,
        sourceNoticeId: raw.sourceNoticeId,
      },
    },
    update: {
      title: raw.title,
      description: raw.description ?? null,
      officialUrl: raw.officialUrl ?? null,
      buyerName: raw.buyerName ?? null,
      buyerSiret: raw.buyerSiret ?? null,
      cpvCodes: raw.cpvCodes ?? [],
      regionCode: raw.regionCode ?? null,
      departmentCode: raw.departmentCode ?? null,
      estimatedValue: raw.estimatedValue ?? null,
      currency: raw.currency ?? null,
      procedureType: raw.procedureType ?? null,
      status: raw.status ?? "open",
      publishedAt: raw.publishedAt ?? null,
      deadline: raw.deadline ?? null,
    },
    create: {
      sourceKey: raw.sourceKey,
      sourceNoticeId: raw.sourceNoticeId,
      title: raw.title,
      description: raw.description ?? null,
      officialUrl: raw.officialUrl ?? null,
      buyerName: raw.buyerName ?? null,
      buyerSiret: raw.buyerSiret ?? null,
      cpvCodes: raw.cpvCodes ?? [],
      regionCode: raw.regionCode ?? null,
      departmentCode: raw.departmentCode ?? null,
      estimatedValue: raw.estimatedValue ?? null,
      currency: raw.currency ?? null,
      procedureType: raw.procedureType ?? null,
      status: raw.status ?? "open",
      publishedAt: raw.publishedAt ?? null,
      deadline: raw.deadline ?? null,
    },
  });

  if (raw.documents?.length) {
    for (const doc of raw.documents) {
      const docId = upserted.id + "-" + hashCode(doc.url);
      await prisma.tenderDocumentLink.upsert({
        where: { id: docId },
        update: {
          type: doc.type ?? null,
          label: doc.label ?? null,
          url: doc.url,
        },
        create: {
          id: docId,
          noticeId: upserted.id,
          type: doc.type ?? null,
          label: doc.label ?? null,
          url: doc.url,
        },
      });
    }
  }
}

function hashCode(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
