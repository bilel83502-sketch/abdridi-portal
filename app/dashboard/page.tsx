import { logoutAction, requireAuth } from "@/lib/auth";

const stats = [
  { title: "Dossiers actifs", value: "12", trend: "+3 ce mois" },
  { title: "Demandes en cours", value: "4", trend: "2 prioritaires" },
  { title: "Taux de traitement", value: "98%", trend: "SLA respecté" },
  { title: "Documents", value: "27", trend: "Dernière mise à jour aujourd'hui" },
];

export default async function DashboardPage() {
  await requireAuth();

  return (
    <section className="min-h-[calc(100vh-170px)] py-2 sm:py-6">
      <div className="grid gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200">Espace sécurisé</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard client</h1>
            <p className="mt-1 text-sm text-slate-300">Session authentifiée.</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://abdridi.com"
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Accueil
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-500/25"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-lg shadow-black/20"
            >
              <p className="text-sm text-slate-400">{item.title}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-xs text-blue-200/80">{item.trend}</p>
            </article>
          ))}
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Activité récente</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Nouvelle demande client créée • il y a 2 heures
            </li>
            <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Rapport mensuel généré • aujourd&apos;hui
            </li>
            <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Mise à jour du profil entreprise • hier
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}
