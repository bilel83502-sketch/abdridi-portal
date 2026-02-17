// =============================================================================
// lib/data/store.ts
// Couche d'accès données Prisma → types UI
// =============================================================================

import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types UI
// ---------------------------------------------------------------------------

export interface Source {
  key: string;
  name: string;
  baseUrl: string;
}

export interface TenderNotice {
  id: string;
  sourceKey: string;
  sourceNoticeId: string;
  title: string;
  description: string | null;
  officialUrl: string | null;
  buyerName: string | null;
  buyerSiret: string | null;
  cpvCodes: string[];
  regionCode: string | null;
  departmentCode: string | null;
  estimatedValue: number | null;
  currency: string | null;
  procedureType: string | null;
  status: string;
  publishedAt: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenderDocument {
  id: string;
  noticeId: string;
  type: string | null;
  label: string | null;
  url: string;
}

export interface Favorite {
  id: string;
  noticeId: string;
  userId: string;
  createdAt: string;
}

export interface Exclusion {
  id: string;
  noticeId: string;
  userId: string;
  reason: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function iso(d: Date): string {
  return d.toISOString();
}

function parseCpv(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export async function listSources(): Promise<Source[]> {
  const rows = await prisma.sourceRegistry.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    key: r.key,
    name: r.name,
    baseUrl: r.baseUrl ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Tenders
// ---------------------------------------------------------------------------

export async function listTenders(): Promise<TenderNotice[]> {
  const rows = await prisma.tenderNotice.findMany({
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    sourceKey: r.sourceKey,
    sourceNoticeId: r.sourceNoticeId,
    title: r.title,
    description: r.description ?? null,
    officialUrl: r.officialUrl ?? null,
    buyerName: r.buyerName ?? null,
    buyerSiret: r.buyerSiret ?? null,
    cpvCodes: parseCpv(r.cpvCodes),
    regionCode: r.regionCode ?? null,
    departmentCode: r.departmentCode ?? null,
    estimatedValue: r.estimatedValue ? Number(r.estimatedValue) : null,
    currency: r.currency ?? null,
    procedureType: r.procedureType ?? null,
    status: r.status ?? "open",
    publishedAt: isoOrNull(r.publishedAt as Date | null),
    deadline: isoOrNull(r.deadline as Date | null),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

export async function getTender(id: string): Promise<TenderNotice | null> {
  const r = await prisma.tenderNotice.findUnique({ where: { id } });
  if (!r) return null;

  return {
    id: r.id,
    sourceKey: r.sourceKey,
    sourceNoticeId: r.sourceNoticeId,
    title: r.title,
    description: r.description ?? null,
    officialUrl: r.officialUrl ?? null,
    buyerName: r.buyerName ?? null,
    buyerSiret: r.buyerSiret ?? null,
    cpvCodes: parseCpv(r.cpvCodes),
    regionCode: r.regionCode ?? null,
    departmentCode: r.departmentCode ?? null,
    estimatedValue: r.estimatedValue ? Number(r.estimatedValue) : null,
    currency: r.currency ?? null,
    procedureType: r.procedureType ?? null,
    status: r.status ?? "open",
    publishedAt: isoOrNull(r.publishedAt as Date | null),
    deadline: isoOrNull(r.deadline as Date | null),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Documents — noticeId (PAS tenderId), orderBy id (PAS createdAt)
// ---------------------------------------------------------------------------

export async function listDocuments(noticeId: string): Promise<TenderDocument[]> {
  const rows = await prisma.tenderDocumentLink.findMany({
    where: { noticeId },
    orderBy: { id: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    noticeId: r.noticeId,
    type: r.type ?? null,
    label: r.label ?? null,
    url: r.url,
  }));
}

// ---------------------------------------------------------------------------
// Favorites — stubs (ne cassent pas le build)
// ---------------------------------------------------------------------------

export async function listFavorites(_userId: string): Promise<Favorite[]> {
  return [];
}

export async function createFavorite(
  _noticeId: string,
  _userId: string
): Promise<Favorite | null> {
  console.warn("[store] createFavorite: modèle non encore créé");
  return null;
}

export async function deleteFavorite(_id: string): Promise<void> {
  console.warn("[store] deleteFavorite: modèle non encore créé");
}

// ---------------------------------------------------------------------------
// Exclusions — stubs
// ---------------------------------------------------------------------------

export async function listExclusions(_userId: string): Promise<Exclusion[]> {
  return [];
}

export async function createExclusion(
  _noticeId: string,
  _userId: string,
  _reason?: string
): Promise<Exclusion | null> {
  console.warn("[store] createExclusion: modèle non encore créé");
  return null;
}

export async function deleteExclusion(_id: string): Promise<void> {
  console.warn("[store] deleteExclusion: modèle non encore créé");
}
