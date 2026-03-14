import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Server-side ADMIN check — cannot be bypassed by JS
  if (!session || user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
