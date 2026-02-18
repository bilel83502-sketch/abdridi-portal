import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
