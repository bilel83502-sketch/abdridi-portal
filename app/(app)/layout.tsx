import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-sub)]">
      <Header />
      <main className="max-w-[1220px] mx-auto px-8 py-7">{children}</main>
    </div>
  );
}
