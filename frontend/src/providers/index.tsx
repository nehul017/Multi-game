'use client';

import { ReactNode, useEffect } from 'react';
import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { SocketProvider } from './socket.provider';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from '@/store/ui.store';

function ThemeInit() {
  const initTheme = useUIStore((s) => s.initTheme);
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeInit />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-card-hover)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-success)',
                  secondary: 'var(--bg-card)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--color-danger)',
                  secondary: 'var(--bg-card)',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
