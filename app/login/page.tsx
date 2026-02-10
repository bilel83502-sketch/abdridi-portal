// app/login/page.tsx
import Link from "next/link";
import { loginAction } from "../lib/auth"; // garde ton action existante (si le chemin diffère, dis-moi)

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const next = searchParams?.next ?? "/dashboard";
  const error = searchParams?.error;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(59,130,246,.18),transparent_60%),radial-gradient(900px_600px_at_90%_10%,rgba(139,92,246,.12),transparent_62%),linear-gradient(180deg,#020814_0%,#030B1B_45%,#041026_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left side (branding / value) */}
          <section className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600" />
              Espace client AB DRIDI
            </div>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              Connexion sécurisée
              <span className="block bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Portail client
              </span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Accédez à votre dashboard, vos demandes et vos prochains livrables.
              Auth simple (MVP) aujourd’hui, évolutif ensuite.
            </p>

            <div className="mt-6 grid max-w-md gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
                <div className="text-sm font-semibold text-white">✔ Accès rapide</div>
                <div className="mt-1 text-sm text-white/65">
                  Connexion en 1 minute, redirection automatique vers le dashboard.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
                <div className="text-sm font-semibold text-white">✔ Sécurisé</div>
                <div className="mt-1 text-sm text-white/65">
                  Cookie httpOnly (MVP) + middleware de protection /dashboard.
                </div>
              </div>
            </div>
          </section>

          {/* Right side (form) */}
          <section className="mx-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_140px_rgba(0,0,0,.55)] backdrop-blur-xl">
              {/* glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-tr from-sky-400/25 to-blue-600/25 blur-3xl" />

              <div className="relative">
                <h2 className="text-xl font-bold text-white">Connexion</h2>
                <p className="mt-1 text-sm text-white/70">
                  Connectez-vous pour accéder au dashboard.
                </p>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    Identifiants incorrects. Réessayez.
                  </div>
                ) : null}

                <form className="mt-6 space-y-4" action={loginAction}>
                  <input type="hidden" name="next" value={next} />

                  <div>
                    <label className="text-xs font-medium tracking-wide text-white/70">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="admin@abdridi.com"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400/60 focus:ring-4 focus:ring-sky-400/15"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium tracking-wide text-white/70">
                      Mot de passe
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400/60 focus:ring-4 focus:ring-sky-400/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 px-4 py-3 text-sm font-extrabold text-[#050607] shadow-[0_18px_70px_rgba(56,189,248,.20)] transition hover:brightness-110 active:scale-[0.99]"
                  >
                    Se connecter
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs text-white/60">
                    <Link className="hover:text-white" href="/">
                      ← Retour à l’accueil
                    </Link>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      MVP
                    </span>
                  </div>
                </form>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-white/50">
              © {new Date().getFullYear()} AB DRIDI — Portail client
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
