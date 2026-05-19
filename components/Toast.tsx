'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', icon: '✓' },
  error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '✕' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: 'ℹ' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  // Listen for global API errors
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) addToast(String(detail), 'error');
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          display: 'flex', flexDirection: 'column', gap: 8,
          pointerEvents: 'none', maxWidth: 380,
        }}
      >
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1px solid ${c.border}`, color: c.text,
              padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              animation: 'toast-slide-in 0.3s ease-out',
              pointerEvents: 'auto',
              fontFamily: "'Outfit', system-ui, sans-serif",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: c.border, color: c.text, fontSize: 12, fontWeight: 700,
              }}>{c.icon}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
