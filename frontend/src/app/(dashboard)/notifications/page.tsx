'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trophy, UserPlus, Gamepad2, MessageSquare, Star, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NotificationItem {
  _id?: string;
  id?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  friend_request: <UserPlus className="w-5 h-5 text-blue-400" />,
  friend_accepted: <UserPlus className="w-5 h-5 text-green-400" />,
  game_invite: <Gamepad2 className="w-5 h-5 text-primary-400" />,
  game_start: <Gamepad2 className="w-5 h-5 text-green-400" />,
  achievement: <Trophy className="w-5 h-5 text-yellow-400" />,
  tournament_start: <Trophy className="w-5 h-5 text-green-400" />,
  tournament_result: <Trophy className="w-5 h-5 text-yellow-400" />,
  level_up: <Star className="w-5 h-5 text-purple-400" />,
  message: <MessageSquare className="w-5 h-5 text-secondary-400" />,
  system: <Bell className="w-5 h-5 text-theme-muted" />,
};

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications(1);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: NotificationItem[] = (data?.data?.data || data?.data || []) as NotificationItem[];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-theme-primary flex items-center gap-3">
                <Bell className="w-7 h-7 text-primary-400 shrink-0" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-theme-muted mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CheckCheck className="w-4 h-4" />}
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="w-full sm:w-auto shrink-0"
              >
                Mark All Read
              </Button>
            )}
          </div>
        </motion.div>

        {isError && (
          <div className="text-center py-12">
            <p className="text-theme-muted mb-4">Failed to load notifications</p>
            <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex items-center gap-4 !p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const notifId = notif._id || notif.id || '';
              return (
                <motion.div
                  key={notifId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    'flex items-center gap-4 !p-4 cursor-pointer hover:bg-surface-light/50',
                    !notif.isRead && 'border-primary-500/20 bg-primary-500/5'
                  )}>
                    <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center shrink-0">
                      {typeIcons[notif.type] || <Bell className="w-5 h-5 text-theme-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-theme-primary">{notif.title}</p>
                        {!notif.isRead && <span className="w-2 h-2 bg-primary-400 rounded-full" />}
                      </div>
                      <p className="text-xs text-theme-muted truncate">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-theme-muted">{formatRelativeTime(notif.createdAt)}</span>
                      {!notif.isRead && (
                        <button
                          onClick={() => markRead.mutate(notifId)}
                          className="p-1 rounded hover:bg-surface-lighter text-theme-muted hover:text-theme-primary"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-theme-muted" />}
            title="No notifications"
            description="You're all caught up! Check back later."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
