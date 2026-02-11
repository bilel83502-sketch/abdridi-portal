import { logoutAction, requireAuth } from "../../lib/auth";

const stats = [
  { title: "Dossiers actifs", value: "12", trend: "+3 ce mois" },
  { title: "Demandes en cours", value: "4", trend: "2 prioritaires" },
  { title: "Taux de traitement", value: "98%", trend: "SLA respecté" },
  { title: "Documents", value: "27", trend: "Dernière mise à jour aujourd'hui" },
];

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <section className="min-h-[calc(100vh-140px)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-sm font-bold text-white">
              A
            </div>
            <div>
              <p className="font-semibold text-white">AB DRIDI</p>
              <p className="text-xs text-slate-400">Client Workspace</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Navigation
            </p>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 font-medium text-blue-100">
              Vue d&apos;ensemble
            </div>
            <div className="rounded-lg px-3 py-2 text-slate-300">Commandes</div>
            <div className="rounded-lg px-3 py-2 text-slate-300">Facturation</div>
            <div className="rounded-lg px-3 py-2 text-slate-300">Support</div>
          </nav>
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/25 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-300">
                Bienvenue, <span className="font-medium text-white">{session.email}</span>
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-500/25"
              >
                Se déconnecter
              </button>
            </form>
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

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20 sm:p-6">
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
      </div>
    </section>
  );
}
