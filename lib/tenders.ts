// lib/tenders.ts
import type { SourceRegistry, TenderCardRow, TenderFilters, TenderNotice } from "@/lib/types";
import { listDocuments, listSources, listTenders } from "@/lib/data/store";
import { matchSourceByUrl } from "@/lib/sources/router/matchSourceByUrl";

export function toDateLabel(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export function countdown(deadlineIso?: string | null): string {
  if (!deadlineIso) return "—";
  const deadline = new Date(deadlineIso).getTime();
  const now = Date.now();
  const diff = deadline - now;
  if (Number.isNaN(deadline)) return "—";
  if (diff <= 0) return "Clôturé";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `Encore ${days} jours`;
}

export function uniqueValues(items: TenderNotice[], key: keyof TenderNotice): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) set.add(value);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function applyFilters(items: TenderNotice[], f: TenderFilters): TenderNotice[] {
  let res = [...items];

  if (f.keywords) {
    const q = f.keywords.toLowerCase();
    res = res.filter((t) => (t.title ?? "").toLowerCase().includes(q) || (t.buyerName ?? "").toLowerCase().includes(q));
  }

  if (f.deadline) {
    const d = new Date(f.deadline).getTime();
    res = res.filter((t) => (t.deadlineAt ? new Date(t.deadlineAt).getTime() <= d : false));
  }

  if (f.location) {
    const q = f.location.toLowerCase();
    res = res.filter((t) => (t.locationLabel ?? "").toLowerCase().includes(q));
  }

  if (f.buyerType) res = res.filter((t) => t.buyerType === f.buyerType);
  if (f.category) res = res.filter((t) => t.category === f.category);

  if (f.cpv) {
    const q = f.cpv.trim();
    res = res.filter((t) => (t.cpv ?? []).some((c) => c.includes(q)));
  }

  if (f.sort === "newest") {
    res.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
  } else {
    res.sort((a, b) => new Date(a.deadlineAt ?? 0).getTime() - new Date(b.deadlineAt ?? 0).getTime());
  }

  return res;
}

export async function getTenderCards(filters: TenderFilters) {
  const pageSize = 20;
  const page = filters.page ?? 1;

  const [tenders, sources] = await Promise.all([listTenders(), listSources()]);
  const filtered = applyFilters(tenders, filters);

  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  const rows: TenderCardRow[] = await Promise.all(
    slice.map(async (tender) => {
      const docs = await listDocuments(tender.id);
      const source = matchSourceByUrl(tender.officialUrl, sources as SourceRegistry[]);
      return { tender, docs, source };
    })
  );

  return { rows, total: filtered.length, page, pageSize };
}
