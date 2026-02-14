// lib/data/store.ts
import { prisma } from "@/lib/prisma";
import type { SourceRegistry, TenderDocument, TenderNotice } from "@/lib/types";

export async function listTenders(): Promise<TenderNotice[]> {
  const rows = await prisma.tenderNotice.findMany({
    orderBy: [{ publishedAt: "desc" }],
    take: 500, // évite de charger des milliers d’un coup
  });
  return rows as unknown as TenderNotice[];
}

export async function getTenderById(id: string): Promise<TenderNotice | null> {
  const row = await prisma.tenderNotice.findUnique({ where: { id } });
  return (row as unknown as TenderNotice) ?? null;
}

export async function listDocuments(noticeId: string): Promise<TenderDocument[]> {
  const rows = await prisma.tenderDocumentLink.findMany({
    where: { noticeId },   // ✅ le champ s’appelle noticeId chez toi
    orderBy: [{ createdAt: "desc" }],
  });
  return rows as unknown as TenderDocument[];
}


export async function listSources(): Promise<SourceRegistry[]> {
  const rows = await prisma.sourceRegistry.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return rows as unknown as SourceRegistry[];
}

export async function createFavorite(userId: string, noticeId: string): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_noticeId: { userId, noticeId } },
    update: {},
    create: { userId, noticeId },
  });
}

export async function createExclude(userId: string, noticeId: string): Promise<void> {
  await prisma.exclude.upsert({
    where: { userId_noticeId: { userId, noticeId } },
    update: {},
    create: { userId, noticeId },
  });
}
