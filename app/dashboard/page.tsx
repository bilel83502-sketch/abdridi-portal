export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bienvenue sur votre espace client.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Accueil
            </a>
            <a
              href="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Se déconnecter
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Commandes", value: "—", hint: "à connecter ensuite" },
          { title: "Profil", value: "—", hint: "infos compte" },
          { title: "Statistiques", value: "—", hint: "activité & suivi" },
        ].map((k) => (
          <div
            key={k.title}
            className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
          >
            <div className="text-sm font-medium text-slate-700">{k.title}</div>
            <div className="mt-2 text-2xl font-semibold">{k.value}</div>
            <div className="mt-2 text-xs text-slate-500">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="text-sm font-medium text-slate-700">Prochaines étapes</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Brancher une vraie authentification (cookie/JWT + middleware)</li>
          <li>Ajouter un vrai menu (sidebar) + pages “Commandes / Profil / Documents”</li>
          <li>Connecter à ta data (API / base)</li>
        </ul>
      </div>
    </div>
  );
}
