import { loginAction } from "../../lib/auth";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasInvalidCredentials = searchParams?.error === "invalid_credentials";

  return (
    <section className="relative min-h-[calc(100vh-140px)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 shadow-lg shadow-blue-950/30 backdrop-blur">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 text-sm font-bold text-white">
              A
            </span>
            <div className="leading-tight">
              <p className="font-semibold text-white">AB DRIDI Portal</p>
              <p className="text-xs text-slate-300">Plateforme sécurisée</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Connexion à votre espace client
            </h1>
            <p className="max-w-xl text-slate-300">
              Accédez à vos informations, vos demandes et votre suivi depuis un espace
              confidentiel conçu pour les clients AB DRIDI.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Se connecter</h2>
              <p className="mt-1 text-sm text-slate-300">
                Utilisez vos identifiants pour continuer.
              </p>
            </div>

            <form action={loginAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-slate-100">
                  Email professionnel
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/25"
                />
              </div>

              {hasInvalidCredentials ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  Identifiants invalides. Merci de vérifier votre email et mot de passe.
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-950/50 transition hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
