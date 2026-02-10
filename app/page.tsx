export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Hello Portal <span className="text-indigo-600">.</span>
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Le socle de votre portail client est prêt et déployé avec succès.
        </p>
        <div className="mt-8 pt-8 border-t border-slate-100">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Connecté à Vercel</span>
        </div>
      </div>
    </main>
  )
}
