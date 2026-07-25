'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { gameService } from '@/services/game.service';
import { tournamentService } from '@/services/tournament.service';
import { chatService } from '@/services/chat.service';
import { notificationService } from '@/services/notification.service';
import { leaderboardService } from '@/services/leaderboard.service';
import { adminService } from '@/services/admin.service';
import { economyService } from '@/services/economy.service';
import { useAuthStore } from '@/store/auth.store';
import { StoreItemType } from '@/types';
import toast from 'react-hot-toast';

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

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

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

// ─── Economy Hooks ──────────────────────────────────────────────────────────

export function useWallet() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const query = useQuery({
    queryKey: ['wallet'],
    queryFn: () => economyService.getWallet(),
  });

  useEffect(() => {
    const wallet = query.data?.data;
    if (wallet) {
      updateUser({
        coins: wallet.coins,
        loginStreak: wallet.loginStreak,
        referralCode: wallet.referralCode,
        referralCount: wallet.referralCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  return query;
}

export function useTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: () => economyService.getTransactions(page, limit),
  });
}

export function useDailyLoginStatus() {
  return useQuery({
    queryKey: ['dailyLogin'],
    queryFn: () => economyService.getDailyLoginStatus(),
  });
}

export function useClaimDailyLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => economyService.claimDailyLogin(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLogin'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`+${res.data.reward} coins! Login streak: ${res.data.streak}`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to claim daily reward')),
  });
}

export function useCoinPacks() {
  return useQuery({
    queryKey: ['coinPacks'],
    queryFn: () => economyService.getCoinPacks(),
  });
}

export function usePurchasePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packId: string) => economyService.purchasePack(packId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`+${res.data.added} coins added to your wallet!`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Purchase failed')),
  });
}

export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: () => economyService.getMissions(),
  });
}

export function useClaimMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => economyService.claimMission(missionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`Claimed ${res.data.coinReward} coins from "${res.data.mission.title}"!`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to claim mission')),
  });
}

export function useStoreCatalog(type?: StoreItemType, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['storeCatalog', type, page, limit],
    queryFn: () => economyService.getCatalog(type, page, limit),
  });
}

export function usePurchaseStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => economyService.purchaseItem(itemId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`Purchased ${res.data.item.name}!`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Purchase failed')),
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => economyService.getInventory(),
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => economyService.equipItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Item equipped!');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to equip item')),
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => economyService.unequipItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Item unequipped');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to unequip item')),
  });
}

// ─── Admin Economy Hooks ────────────────────────────────────────────────────

export function useAdminStoreItems(page = 1) {
  return useQuery({
    queryKey: ['adminStoreItems', page],
    queryFn: () => adminService.getStoreItemsAdmin(page),
  });
}

export function useCreateStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.createStoreItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStoreItems'] });
      toast.success('Store item created');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create item')),
  });
}

export function useUpdateStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminService.updateStoreItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStoreItems'] });
      toast.success('Store item updated');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update item')),
  });
}

export function useDeleteStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteStoreItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStoreItems'] });
      toast.success('Store item deleted');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete item')),
  });
}

export function useAdminCoinPacks() {
  return useQuery({
    queryKey: ['adminCoinPacks'],
    queryFn: () => adminService.getCoinPacksAdmin(),
  });
}

export function useCreateCoinPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.createCoinPack(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoinPacks'] });
      toast.success('Coin pack created');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create pack')),
  });
}

export function useUpdateCoinPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminService.updateCoinPack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoinPacks'] });
      toast.success('Coin pack updated');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update pack')),
  });
}

export function useDeleteCoinPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteCoinPack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoinPacks'] });
      toast.success('Coin pack deleted');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete pack')),
  });
}

export function useAdminMissions() {
  return useQuery({
    queryKey: ['adminMissions'],
    queryFn: () => adminService.getMissionsAdmin(),
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.createMission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
      toast.success('Mission created');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create mission')),
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminService.updateMission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
      toast.success('Mission updated');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update mission')),
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
      toast.success('Mission deleted');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete mission')),
  });
}

export function useAdjustUserCoins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      adminService.adjustUserCoins(userId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User balance updated');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to adjust coins')),
  });
}
