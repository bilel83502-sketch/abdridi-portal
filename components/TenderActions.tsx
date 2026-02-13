"use client";

import { useState } from "react";

async function post(url: string) {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function TenderActions({ noticeId }: { noticeId: string }) {
  const [busy, setBusy] = useState<"favorite" | "exclude" | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={!!busy}
        className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        onClick={async () => {
          try {
            setBusy("favorite");
            await post(`/api/tenders/${noticeId}/favorite`);
          } finally {
            setBusy(null);
          }
        }}
      >
        Favori
      </button>

      <button
        disabled={!!busy}
        className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        onClick={async () => {
          try {
            setBusy("exclude");
            await post(`/api/tenders/${noticeId}/exclude`);
          } finally {
            setBusy(null);
          }
        }}
      >
        Écarter
      </button>

      <button
        className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
        onClick={async () => {
          const url = `${window.location.origin}/tenders/${noticeId}`;
          await navigator.clipboard.writeText(url);
        }}
      >
        Partager
      </button>
    </div>
  );
}
