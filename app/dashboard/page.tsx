import Link from "next/link";

import { TenderActions } from "@/components/TenderActions";
import { requireAuth } from "@/lib/auth";
import { listTenders } from "@/lib/data/store";
import { countdown, getTenderCards, toDateLabel, uniqueValues } from "@/lib/tenders";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAuth();

  const filters = {
    keywords: typeof searchParams.keywords === "string" ? searchParams.keywords : undefined,
    deadline: typeof searchParams.deadline === "string" ? searchParams.deadline : undefined,
    location: typeof searchParams.location === "string" ? searchParams.location : undefined,
    buyerType: typeof searchParams.buyerType === "string" ? searchParams.buyerType : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    cpv: typeof searchParams.cpv === "string" ? searchParams.cpv : undefined,
    sort: searchParams.sort === "newest" ? "newest" : "nearest",
    page: Number(typeof searchParams.page === "string" ? searchParams.page : "1") || 1,
  } as const;

  const [cards, allTenders] = await Promise.all([getTenderCards(filters), listTenders()]);
  const buyerTypes = uniqueValues(allTenders, "buyerType");
  const categories = uniqueValues(allTenders, "category");

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Appels d&apos;offres France</h1>
        <p className="mt-1 text-sm text-slate-300">Ingestion légale (API officielles) + link-out vers plateformes officielles.</p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:grid-cols-4">
        <input name="keywords" defaultValue={filters.keywords} placeholder="Mots-clés" className="rounded bg-slate-950 p-2" />
        <input name="deadline" defaultValue={filters.deadline} type="date" className="rounded bg-slate-950 p-2" />
        <input name="location" defaultValue={filters.location} placeholder="Lieu" className="rounded bg-slate-950 p-2" />
        <input name="cpv" defaultValue={filters.cpv} placeholder="CPV" className="rounded bg-slate-950 p-2" />
        <select name="buyerType" defaultValue={filters.buyerType} className="rounded bg-slate-950 p-2">
          <option value="">Type acheteur</option>
          {buyerTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={filters.category} className="rounded bg-slate-950 p-2">
          <option value="">Catégorie</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={filters.sort} className="rounded bg-slate-950 p-2">
          <option value="nearest">Échéance la plus proche</option>
          <option value="newest">Plus récent</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Filtrer</button>
      </form>

      <div className="space-y-4">
        {cards.rows.map(({ tender, docs, source }) => (
          <article key={tender.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-amber-300">Échéance: {countdown(tender.deadlineAt)}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{tender.title}</h2>
                <p className="text-sm text-slate-300">{tender.buyerName}</p>
                <p className="text-xs text-slate-400">Réf: {tender.referenceCode ?? tender.sourceNoticeId}</p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>{tender.locationLabel}</p>
                <p className="inline-block rounded bg-indigo-900/60 px-2 py-0.5">{tender.category}</p>
                <p className="mt-1">Plateforme: {source?.name ?? tender.sourceKey}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 text-xs">
              {docs.map((doc) => (
                <span key={doc.id} className="rounded bg-slate-800 px-2 py-1 text-slate-200">
                  {doc.type}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 pt-3">
              <TenderActions noticeId={tender.id} />
              <div className="flex items-center gap-2">
                <Link href={`/tenders/${tender.id}`} className="rounded border border-slate-600 px-3 py-2 text-xs">
                  Détails
                </Link>
                <a href={tender.officialUrl} target="_blank" className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white" rel="noreferrer">
                  Voir la consultation
                </a>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Publié le {toDateLabel(tender.publishedAt)} • Date limite {toDateLabel(tender.deadlineAt)}</p>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>
          {cards.total} résultats • page {cards.page}
        </span>
        <div className="space-x-2">
          {cards.page > 1 ? <Link href={`?page=${cards.page - 1}`}>Précédent</Link> : null}
          {cards.total > cards.page * cards.pageSize ? <Link href={`?page=${cards.page + 1}`}>Suivant</Link> : null}
        </div>
      </div>
    </section>
  );
}
