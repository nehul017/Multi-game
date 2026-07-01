'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useSocketStore } from '@/store/socket.store';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return <>{children}</>;
}
