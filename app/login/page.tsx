import { loginAction } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasInvalidCredentials = searchParams?.error === "invalid_credentials";

  return (
    <section className="relative min-h-[calc(100vh-170px)] overflow-hidden py-4 sm:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100">
            Portail privé
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Connexion sécurisée à votre espace AB DRIDI.
          </h1>
          <p className="max-w-xl text-slate-300">
            Retrouvez vos indicateurs, vos interactions récentes et la vue d&apos;ensemble de vos
            activités dans un environnement protégé.
          </p>
          <a
            href="https://abdridi.com"
            className="inline-flex rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Retour à l&apos;accueil
          </a>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-white">Connexion</h2>
          <p className="mt-2 text-sm text-slate-400">Veuillez renseigner vos accès.</p>

          <form action={loginAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-100">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@entreprise.com"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/25"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-100">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="•••••••"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/25"
              />
            </div>

            {hasInvalidCredentials ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Identifiants invalides. Merci de réessayer.
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-950/50 transition hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
