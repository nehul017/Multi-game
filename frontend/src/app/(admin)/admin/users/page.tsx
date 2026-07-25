'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, Trash2, Shield, MoreVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown } from '@/components/ui/Dropdown';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminUsers, useBanUser, useUnbanUser } from '@/hooks';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const debounceTimer = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setDebouncedSearch(value);
          setCurrentPage(1);
        }, 400);
      };
    })(),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debounceTimer(value);
  };

  const { data: usersRes, isLoading, isError, refetch } = useAdminUsers(currentPage, debouncedSearch || undefined);
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const deleteUser = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const makeAdmin = useMutation({
    mutationFn: (userId: string) => adminService.makeAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User promoted to admin');
    },
    onError: () => toast.error('Failed to make admin'),
  });

  const users = usersRes?.data?.data ?? [];
  const totalPages = usersRes?.data?.totalPages ?? 1;
  const total = usersRes?.data?.total ?? 0;

  const handleBan = (userId: string) => {
    const reason = prompt('Enter ban reason:');
    if (reason) {
      banUser.mutate({ userId, reason });
    }
  };

  const handleUnban = (userId: string) => {
    unbanUser.mutate(userId);
  };

  const handleDelete = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      deleteUser.mutate(userId);
    }
  };

  const handleMakeAdmin = (userId: string) => {
    if (confirm('Promote this user to admin?')) {
      makeAdmin.mutate(userId);
    }
  };

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load users" message="Could not fetch user data." onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-theme-primary">User Management</h1>
          <p className="text-theme-muted mt-1">Manage platform users</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <SearchInput value={search} onChange={handleSearchChange} placeholder="Search users..." className="flex-1 max-w-sm" />
          <Badge variant="info">{total} total users</Badge>
        </div>

        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-light/50 border-b border-surface-lighter/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">ELO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Games</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-lighter/20">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-0">
                        <TableRowSkeleton />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState title="No users found" description="Try adjusting your search criteria." />
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user._id || user.id} className="hover:bg-surface-light/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.username} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-theme-primary">{user.username}</p>
                            <p className="text-xs text-theme-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'purple' : user.role === 'moderator' ? 'info' : 'default'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBanned ? (
                          <Badge variant="danger">Banned</Badge>
                        ) : (
                          <Badge variant={user.status === 'online' ? 'success' : user.status === 'in-game' ? 'purple' : 'default'}>
                            {user.status || 'offline'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-muted">{user.elo ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-theme-muted">{user.gamesPlayed ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown
                          trigger={
                            <button className="p-1.5 rounded-lg hover:bg-surface-light text-theme-muted hover:text-theme-primary transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                          items={[
                            { label: 'View Profile', icon: <Search className="w-4 h-4" />, onClick: () => {} },
                            {
                              label: user.isBanned ? 'Unban User' : 'Ban User',
                              icon: <Ban className="w-4 h-4" />,
                              onClick: () => user.isBanned ? handleUnban(user._id || user.id) : handleBan(user._id || user.id),
                              danger: !user.isBanned,
                            },
                            { label: 'Make Admin', icon: <Shield className="w-4 h-4" />, onClick: () => handleMakeAdmin(user._id || user.id), divider: true },
                            { label: 'Delete User', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(user._id || user.id, user.username), danger: true, divider: true },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {!isLoading && users.length > 0 && (
          <div className="flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
