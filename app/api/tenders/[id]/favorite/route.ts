import Link from "next/link";
import { notFound } from "next/navigation";

import { TenderActions } from "@/components/TenderActions";
import { getTenderById, listDocuments, listSources } from "@/lib/data/store";
import { countdown, toDateLabel } from "@/lib/tenders";
import { matchSourceByUrl } from "@/lib/sources/router/matchSourceByUrl";

export default async function TenderDetailPage({ params }: { params: { id: string } }) {
  const tender = await getTenderById(params.id);
  if (!tender) notFound();

  const [docs, sources] = await Promise.all([listDocuments(tender.id), listSources()]);
  const source = matchSourceByUrl(tender.officialUrl, sources);
  const dceDoc = docs.find((doc) => doc.type === "DCE");

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <Link href="/dashboard" className="text-xs text-slate-400">
          ← Retour dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{tender.title}</h1>
        <p className="mt-2 text-sm text-slate-300">{tender.buyerName}</p>
        <p className="text-xs text-slate-400">Plateforme: {source?.name ?? tender.sourceKey}</p>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Pièces du marché</h2>
          <ul className="mt-2 space-y-2">
            {docs.map((doc) => (
              <li key={doc.id}>
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm text-blue-300 underline">
                  [{doc.type}] {doc.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <aside className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <p className="text-xs text-slate-400">Deadline</p>
        <p className="text-xl font-semibold text-amber-300">{countdown(tender.deadlineAt)}</p>
        <p className="mt-1 text-xs text-slate-400">Date limite: {toDateLabel(tender.deadlineAt)}</p>

        <div className="mt-4 space-y-2">
          <a href={tender.officialUrl} target="_blank" rel="noreferrer" className="block rounded bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white">
            Accéder à la consultation
          </a>
          {dceDoc ? (
            <a href={dceDoc.url} target="_blank" rel="noreferrer" className="block rounded border border-slate-600 px-3 py-2 text-center text-sm">
              Télécharger le DCE
            </a>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-700 pt-3">
          <TenderActions noticeId={tender.id} />
        </div>
      </aside>
    </section>
  );
}
