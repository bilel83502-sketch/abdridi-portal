// app/dashboard/page.tsx
import Link from "next/link";
import { requireAuth, logoutAction } from "../../lib/auth";

export default async function DashboardPage() {
  // Protège la page côté serveur
  // Si non connecté -> redirect vers /login dans requireAuth
  const session = await requireAuth();

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header dashboard */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Dashboard
              </h1>
              <p className="mt-2 text-slate-600">
                Bienvenue sur votre espace client.
              </p>

              {/* Si tu as des infos session, tu peux les afficher */}
              <p className="mt-3 text-sm text-slate-500">
                Connecté en tant que{" "}
                <span className="font-medium text-slate-900">
                  {session?.email ?? "client"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Accueil
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Commandes", value: "—", hint: "à connecter ensuite" },
            { title: "Profil", value: "—", hint: "infos compte" },
            { title: "Statistiques", value: "—", hint: "activité & suivi" },
          ].map((k) => (
            <div
              key={k.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-medium text-slate-900">{k.title}</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {k.value}
              </div>
              <div className="mt-2 text-sm text-slate-500">{k.hint}</div>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-900">Prochaines étapes</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Brancher une vraie authentification (cookie/JWT + middleware)</li>
            <li>Ajouter un vrai menu (sidebar) + pages “Commandes / Profil / Documents”</li>
            <li>Connecter à ta data (API / base)</li>
          </ul>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Abdridi — Portail client
        </footer>
      </div>
    </main>
  );
}
