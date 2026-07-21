'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { gameService } from '@/services/game.service';
import { tournamentService } from '@/services/tournament.service';
import { chatService } from '@/services/chat.service';
import { notificationService } from '@/services/notification.service';
import { leaderboardService } from '@/services/leaderboard.service';
import { adminService } from '@/services/admin.service';
import { platformService } from '@/services/platform.service';
import toast from 'react-hot-toast';

// Auth Hooks
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
    retry: false,
  });
}

// User Hooks
export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userService.updateProfile>[0]) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => userService.getFriends(),
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests'],
    queryFn: () => userService.getFriendRequests(),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => userService.sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      toast.success('Friend request sent!');
    },
    onError: () => toast.error('Failed to send request'),
  });
}

export function useAcceptFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => userService.acceptFriend(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      toast.success('Friend request accepted!');
    },
  });
}

export function useRejectFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => userService.rejectFriend(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      toast.success('Friend request rejected');
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => userService.removeFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Friend removed');
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => userService.searchUsers(query),
    enabled: query.length >= 2,
  });
}

export function useMatchHistory(userId?: string, page = 1) {
  return useQuery({
    queryKey: ['matchHistory', userId, page],
    queryFn: () => userService.getMatchHistory(userId, page),
  });
}

// Game Hooks
export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: () => gameService.getGames(),
  });
}

export function useGame(slug: string) {
  return useQuery({
    queryKey: ['game', slug],
    queryFn: () => gameService.getGame(slug),
    enabled: !!slug,
  });
}

export function useGameRooms(gameSlug: string) {
  return useQuery({
    queryKey: ['rooms', gameSlug],
    queryFn: () => gameService.getRooms(gameSlug),
    enabled: !!gameSlug,
    refetchInterval: 5000,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameType, settings }: { gameType: string; settings?: Record<string, unknown> }) =>
      gameService.createMatch(gameType, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Match created!');
    },
    onError: () => toast.error('Failed to create match'),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameSlug, data }: { gameSlug: string; data: { name: string; isPrivate: boolean; maxPlayers: number; password?: string } }) =>
      gameService.createRoom(gameSlug, data),
    onSuccess: (_, { gameSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', gameSlug] });
      toast.success('Room created!');
    },
    onError: () => toast.error('Failed to create room'),
  });
}

export function useMatches(page = 1) {
  return useQuery({
    queryKey: ['matches', page],
    queryFn: () => gameService.getMatches(page),
  });
}

// Tournament Hooks
export function useTournaments(page = 1, status?: string) {
  return useQuery({
    queryKey: ['tournaments', page, status],
    queryFn: () => tournamentService.getTournaments(page, 10, status),
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentService.getTournament(id),
    enabled: !!id,
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentService.joinTournament(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Joined tournament!');
    },
    onError: () => toast.error('Failed to join tournament'),
  });
}

// Chat Hooks
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  });
}

export function useMessages(userId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', userId, page],
    queryFn: () => chatService.getMessages(userId, page),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      chatService.sendMessage(receiverId, content),
    onSuccess: (_, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Notification Hooks
export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.getNotifications(page),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
}

export function usePlatformStatus() {
  return useQuery({
    queryKey: ['platformStatus'],
    queryFn: () => platformService.getStatus(),
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });
}

// Leaderboard Hooks
export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all', gameSlug?: string, page = 1) {
  return useQuery({
    queryKey: ['leaderboard', period, gameSlug, page],
    queryFn: () => leaderboardService.getLeaderboard(period, gameSlug, page),
  });
}

export function useTopPlayers(limit = 10) {
  return useQuery({
    queryKey: ['topPlayers', limit],
    queryFn: () => leaderboardService.getTopPlayers(limit),
  });
}

// Admin Hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
  });
}

export function useAdminUsers(page = 1, search?: string) {
  return useQuery({
    queryKey: ['adminUsers', page, search],
    queryFn: () => adminService.getUsers(page, 20, search),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => adminService.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User banned');
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User unbanned');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User deleted');
    },
  });
}

export function useAdminGames() {
  return useQuery({
    queryKey: ['adminGames'],
    queryFn: () => adminService.getGames(),
  });
}

export function useServerHealth() {
  return useQuery({
    queryKey: ['serverHealth'],
    queryFn: () => adminService.getHealth(),
    refetchInterval: 30000,
  });
}

export function useAdminReports(status?: string) {
  return useQuery({
    queryKey: ['adminReports', status],
    queryFn: () => adminService.getReports(status),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: string }) =>
      adminService.resolveReport(reportId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast.success('Report resolved');
    },
  });
}

export function useBroadcast() {
  return useMutation({
    mutationFn: ({ title, message }: { title: string; message: string }) =>
      adminService.broadcast(title, message),
    onSuccess: () => {
      toast.success('Announcement broadcast');
    },
  });
}
