<header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
  <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-blue-900/40">
        A
      </div>
      <div className="leading-tight">
        <p className="font-semibold tracking-wide text-white">AB DRIDI</p>
        <p className="text-xs text-slate-300">Portail client</p>
      </div>
    </div>

    <nav className="flex items-center gap-2 text-sm font-medium">
      <a
        href="https://abdridi.com"
        target="_blank"
        rel="noreferrer"
        className="rounded-lg px-3 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
      >
        Accueil
      </a>
      <Link
        href="/login"
        className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-500/20"
      >
        Connexion
      </Link>
    </nav>
  </div>
</header>
