export default function Home() {
  return (
    <section className="grid gap-6 py-6 sm:py-10">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-12">
        <p className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
          Portail sécurisé AB DRIDI
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Espace client premium pour le suivi de vos activités.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Connectez-vous pour accéder à votre tableau de bord privé, suivre vos indicateurs,
          consulter l&apos;activité récente et centraliser vos échanges.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/login"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-400 hover:to-indigo-600"
          >
            Se connecter
          </a>
          <a
            href="https://abdridi.com"
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Retour au site abdridi.com
          </a>
        </div>
      </div>
    </section>
  );
}
