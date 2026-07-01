'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { SocketProvider } from './socket.provider';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e1e2e',
                color: '#e2e8f0',
                border: '1px solid #3a3a4e',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#1e1e2e',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1e1e2e',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
