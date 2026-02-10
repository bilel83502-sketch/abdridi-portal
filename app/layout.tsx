import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abdridi Portal",
  description: "Espace client sécurisé",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50" />
          <div className="absolute left-1/2 top-[-120px] h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute left-1/3 top-[240px] h-[280px] w-[520px] rounded-full bg-sky-200/30 blur-3xl" />
        </div>

        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <span className="text-sm font-bold">A</span>
              </div>
              <div className="leading-tight">
                <div className="font-semibold">Abdridi Portal</div>
                <div className="text-xs text-slate-500">Espace client</div>
              </div>
            </div>

            <nav className="flex items-center gap-3 text-sm">
              <a className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100" href="/">
                Accueil
              </a>
              <a className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100" href="/login">
                Connexion
              </a>
              <a
                className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-indigo-700"
                href="/dashboard"
              >
                Dashboard
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          {children}
        </main>

        <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Abdridi — Portail client
          </div>
        </footer>
      </body>
    </html>
  );
}
