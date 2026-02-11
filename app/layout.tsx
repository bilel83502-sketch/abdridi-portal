import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AB DRIDI Portal",
  description: "Espace client sécurisé",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#172554_0%,#0f172a_40%,#020617_100%)]" />

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

        <main>{children}</main>

        <footer className="border-t border-white/10 bg-slate-950/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 text-xs text-slate-400 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} AB DRIDI — Portail client sécurisé
          </div>
        </footer>
      </body>
    </html>
  );
}
