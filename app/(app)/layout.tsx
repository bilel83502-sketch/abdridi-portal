import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';
import { ToastProvider } from '@/components/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--surface-sub)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Aller au contenu principal
        </a>
        <Header />
        <main id="main-content" className="max-w-[1220px] mx-auto px-4 md:px-8 py-5 md:py-7">{children}</main>
        <Chatbot />
      </div>
    </ToastProvider>
  );
}
