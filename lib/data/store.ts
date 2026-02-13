// lib/data/store.ts
import type { SourceRegistry, TenderDocument, TenderNotice } from "@/lib/types";

// --- MOCK DATA (à remplacer par Prisma plus tard) ---
const SOURCES: SourceRegistry[] = [
  { key: "boamp", name: "BOAMP", baseUrl: "https://www.boamp.fr" },
  { key: "ted", name: "TED", baseUrl: "https://ted.europa.eu" },
  { key: "place", name: "PLACE", baseUrl: "https://www.marches-publics.gouv.fr" },
];

const TENDERS: TenderNotice[] = [
  {
    id: "1",
    sourceKey: "boamp",
    sourceNoticeId: "AF-26-002",
    referenceCode: "AF-26-002",
    title: "ENTRETIEN – INSTALLATION DES MOUILLAGES DE L’ÎLE DE GROIX",
    buyerName: "COMMUNE DE GROIX (56)",
    buyerType: "Collectivité",
    locationLabel: "(56) Morbihan",
    category: "TRAVAUX",
    publishedAt: new Date("2026-02-12").toISOString(),
    deadlineAt: new Date("2026-03-03T12:00:00.000Z").toISOString(),
    officialUrl: "https://www.boamp.fr",
    status: "OPEN",
    cpv: ["45200000"],
  },
];

const DOCS: TenderDocument[] = [
  { id: "d1", noticeId: "1", type: "DCE", label: "DCE", url: "https://example.com/dce.pdf" },
  { id: "d2", noticeId: "1", type: "RC", label: "Règlement de consultation", url: "https://example.com/rc.pdf" },
];

// --- API (mock) ---
export async function listTenders(): Promise<TenderNotice[]> {
  return TENDERS;
}

export async function getTenderById(id: string): Promise<TenderNotice | null> {
  return TENDERS.find((t) => t.id === id) ?? null;
}

export async function listDocuments(noticeId: string): Promise<TenderDocument[]> {
  return DOCS.filter((d) => d.noticeId === noticeId);
}

export async function listSources(): Promise<SourceRegistry[]> {
  return SOURCES;
}

export async function createFavorite(_userId: string, _noticeId: string): Promise<void> {
  // stub (Prisma plus tard)
}

export async function createExclude(_userId: string, _noticeId: string): Promise<void> {
  // stub (Prisma plus tard)
}
