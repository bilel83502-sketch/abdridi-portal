export default function Home() {
  return (
    <div className="grid gap-8">
      <section className="rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Portail client Abdridi
          </h1>
          <p className="max-w-2xl text-slate-600">
            Accédez à votre espace client sécurisé : suivi, informations, documents et prochaines étapes.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Se connecter
            </a>
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Aller au dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Suivi", desc: "Vue claire des éléments importants et de vos actions en cours." },
          { title: "Documents", desc: "Centralisation des fichiers utiles (à ajouter ensuite)." },
          { title: "Support", desc: "Points de contact et demande d’assistance rapide." },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur"
          >
            <div className="text-lg font-semibold">{c.title}</div>
            <div className="mt-2 text-sm text-slate-600">{c.desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
