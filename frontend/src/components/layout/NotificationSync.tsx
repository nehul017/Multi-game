'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notification.store';
import { useUnreadNotificationCount } from '@/hooks';

export function NotificationSync() {
  const { data } = useUnreadNotificationCount();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  useEffect(() => {
    const count = (data?.data as { count?: number } | undefined)?.count;
    if (count !== undefined) {
      setUnreadCount(count);
    }
  }, [data, setUnreadCount]);

  return null;
}
