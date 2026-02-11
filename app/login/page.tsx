// app/login/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "../lib/auth";

export default function LoginPage() {
  // Si déjà connecté, on peut rediriger (optionnel)
  // (si tu n'as pas de fonction isAuthed côté server, laisse ça comme ça)
  // try { await requireAuth(); redirect("/dashboard"); } catch {}

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Colonne gauche (branding) */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-4 py-2 shadow-sm">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white font-bold">
                A
              </span>
              <div className="leading-tight">
                <div className="font-semibold text-slate-900">Abdridi Portal</div>
                <div className="text-xs text-slate-500">Espace client</div>
              </div>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Connexion
            </h1>
            <p className="max-w-prose text-slate-600 leading-relaxed">
              Connectez-vous pour accéder à votre espace client, suivre vos demandes,
              et consulter vos informations.
            </p>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-900">Accès de test</div>
              <div className="mt-2 grid gap-2 text-sm text-slate-600">
                <div>
                  <span className="font-medium text-slate-900">Email :</span>{" "}
                  <span className="font-mono">admin@abdridi.com</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900">Mot de passe :</span>{" "}
                  <span className="font-mono">password123</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                (Tu pourras supprimer ce bloc dès que tu passes en prod.)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Retour à l’accueil
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700"
              >
                Aller au dashboard
              </Link>
            </div>
          </section>

          {/* Colonne droite (formulaire) */}
          <section className="lg:justify-self-end">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <div className="text-lg font-semibold text-slate-900">Se connecter</div>
                <div className="text-sm text-slate-600">
                  Entrez vos identifiants pour continuer.
                </div>
              </div>

              <form action={loginAction} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@abdridi.com"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-indigo-600/20 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900">Mot de passe</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-indigo-600/20 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4"
                    autoComplete="current-password"
                  />
                </div>

                {/* Si ton loginAction renvoie un query param ?error=1, on peut l'afficher */}
                {/* (optionnel) */}

                <button
                  type="submit"
                  className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
                >
                  Se connecter
                </button>

                <div className="pt-2 text-center text-xs text-slate-500">
                  En vous connectant, vous acceptez les conditions d’utilisation.
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
