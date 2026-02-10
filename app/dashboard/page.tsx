export default function DashboardPage() {
  const cards = [
    { title: "Commandes", value: "—", hint: "Suivi des expéditions & historiques" },
    { title: "Profil", value: "—", hint: "Infos compte, sécurité, préférences" },
    { title: "Statistiques", value: "—", hint: "Activité & performance" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Espace client
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Bienvenue sur votre espace client Abdridi. Sélectionnez un module.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Se reconnecter
            </a>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              type="button"
            >
              Nouvelle demande
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((k) => (
            <div
              key={k.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {k.title}
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">
                    {k.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{k.hint}</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  MVP
                </div>
              </div>

              <a
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline"
              >
                Ouvrir
                <span aria-hidden className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-700">Prochaines étapes</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Brancher une vraie authentification (cookie/JWT + middleware)</li>
            <li>Ajouter un menu (sidebar) + pages Commandes / Profil / Documents</li>
            <li>Connecter la data (API / base) et sécuriser par compte client</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
