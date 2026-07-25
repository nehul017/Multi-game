'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Gift,
  Copy,
  Check,
  Users,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { CoinDisplay } from '@/components/economy/CoinDisplay';
import { RewardPopup } from '@/components/economy/RewardPopup';
import {
  useWallet,
  useTransactions,
  useDailyLoginStatus,
  useClaimDailyLogin,
  useMissions,
  useClaimMission,
} from '@/hooks';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Mission } from '@/types';

const TX_TYPE_LABEL: Record<string, string> = {
  match_win: 'Match Win',
  match_loss: 'Match Loss',
  match_draw: 'Match Draw',
  daily_login: 'Daily Login',
  mission: 'Mission Reward',
  achievement: 'Achievement',
  referral: 'Referral Bonus',
  pack_purchase: 'Coin Pack',
  store_purchase: 'Store Purchase',
  admin_grant: 'Admin Grant',
  admin_deduct: 'Admin Deduction',
  refund: 'Refund',
  welcome: 'Welcome Bonus',
};

function MissionRow({ mission, onClaim, isClaiming }: { mission: Mission; onClaim: (id: string) => void; isClaiming: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-theme-secondary border border-theme"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary-500/15 border border-primary-500/20 shrink-0">
            <Target className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-theme-primary">{mission.title}</p>
              <Badge variant={mission.type === 'daily' ? 'info' : 'purple'} size="sm">
                {mission.type}
              </Badge>
            </div>
            <p className="text-xs text-theme-muted mt-0.5">{mission.description}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-amber-500 flex items-center gap-1 justify-end">
            <Coins className="w-3.5 h-3.5" /> +{mission.coinReward}
          </p>
          {mission.xpReward > 0 && <p className="text-xs text-theme-muted">+{mission.xpReward} XP</p>}
        </div>
      </div>
      <ProgressBar value={mission.progress} max={mission.target} showValue size="sm" />
      <div className="mt-3 flex justify-end">
        {mission.claimed ? (
          <Badge variant="success">Claimed</Badge>
        ) : mission.completed ? (
          <Button size="sm" isLoading={isClaiming} onClick={() => onClaim(mission.id)}>
            Claim Reward
          </Button>
        ) : (
          <Badge variant="default">In Progress</Badge>
        )}
      </div>
    </motion.div>
  );
}

export default function WalletPage() {
  const [txPage, setTxPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [reward, setReward] = useState<{ amount: number; title: string; description?: string } | null>(null);

  const { data: walletRes, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } = useWallet();
  const { data: dailyRes, isLoading: dailyLoading } = useDailyLoginStatus();
  const { data: txRes, isLoading: txLoading } = useTransactions(txPage, 10);
  const { data: missionsRes, isLoading: missionsLoading } = useMissions();

  const claimDailyLogin = useClaimDailyLogin();
  const claimMission = useClaimMission();

  const wallet = walletRes?.data;
  const daily = dailyRes?.data;
  const txPageData = txRes?.data;
  const transactions = txPageData?.data ?? [];
  const missions = missionsRes?.data ?? [];

  const dailyMissions = missions.filter((m) => m.type === 'daily');
  const weeklyMissions = missions.filter((m) => m.type === 'weekly');

  const handleCopyReferral = async () => {
    if (!wallet?.referralCode) return;
    await navigator.clipboard.writeText(wallet.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimDaily = () => {
    claimDailyLogin.mutate(undefined, {
      onSuccess: (res) => {
        setReward({
          amount: res.data.reward,
          title: 'Daily Reward Claimed!',
          description: `Login streak: ${res.data.streak} day${res.data.streak === 1 ? '' : 's'}`,
        });
      },
    });
  };

  const handleClaimMission = (missionId: string) => {
    claimMission.mutate(missionId, {
      onSuccess: (res) => {
        setReward({
          amount: res.data.coinReward,
          title: 'Mission Complete!',
          description: res.data.mission.title,
        });
      },
    });
  };

  if (walletError) {
    return (
      <DashboardLayout>
        <ErrorState title="Failed to load wallet" message="Could not fetch your wallet data." onRetry={refetchWallet} />
      </DashboardLayout>
    );
  }

  const streakDots = Array.from({ length: 7 }, (_, i) => i < ((daily?.loginStreak ?? 0) % 7 || (daily?.claimedToday ? 7 : 0)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-heading">Wallet</h1>
          <p className="text-theme-muted mt-2 text-base">Manage your coins, rewards, and referrals</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-glow-purple">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-theme-muted uppercase tracking-wider">Coin Balance</p>
              </div>
              {walletLoading ? (
                <Skeleton className="h-10 w-32 mb-2" />
              ) : (
                <p className="stat-value mb-1">{(wallet?.coins ?? 0).toLocaleString()}</p>
              )}
              <p className="text-sm text-theme-muted">Available coins</p>
            </div>
          </Card>

          {/* Daily Login */}
          <Card>
            <CardHeader className="flex items-center justify-between !mb-4">
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary-500" /> Daily Login
              </CardTitle>
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-400">
                <Flame className="w-3.5 h-3.5" /> {daily?.loginStreak ?? 0} day streak
              </span>
            </CardHeader>
            {dailyLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-4">
                  {streakDots.map((filled, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-1.5 rounded-full',
                        filled ? 'bg-gradient-primary' : 'bg-theme-secondary border border-theme'
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-theme-muted">Next reward</p>
                    <p className="text-sm font-semibold text-amber-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {daily?.nextReward ?? 0} coins
                    </p>
                  </div>
                  <Button
                    size="sm"
                    isLoading={claimDailyLogin.isPending}
                    disabled={daily?.claimedToday}
                    onClick={handleClaimDaily}
                  >
                    {daily?.claimedToday ? 'Claimed Today' : 'Claim'}
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Referral */}
          <Card>
            <CardHeader className="flex items-center justify-between !mb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" /> Referrals
              </CardTitle>
              <Badge variant="info">{wallet?.referralCount ?? 0} invited</Badge>
            </CardHeader>
            <p className="text-xs text-theme-muted mb-2">Share your code — you and your friend both earn coins.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 input-glass px-4 py-2.5 text-sm font-mono font-semibold tracking-wider text-theme-primary truncate">
                {walletLoading ? <Skeleton className="h-4 w-24" /> : wallet?.referralCode || '—'}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyReferral} disabled={!wallet?.referralCode}>
                {copied ? <Check className="w-4 h-4 text-theme-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* Missions */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            <CardTitle>Missions</CardTitle>
          </CardHeader>
          {missionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : missions.length === 0 ? (
            <EmptyState icon={<Target className="w-9 h-9 text-theme-muted" />} title="No missions available" description="Check back later for new missions." />
          ) : (
            <div className="space-y-6">
              {dailyMissions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">Daily</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dailyMissions.map((m) => (
                      <MissionRow key={m.id} mission={m} onClaim={handleClaimMission} isClaiming={claimMission.isPending} />
                    ))}
                  </div>
                </div>
              )}
              {weeklyMissions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">Weekly</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyMissions.map((m) => (
                      <MissionRow key={m.id} mission={m} onClaim={handleClaimMission} isClaiming={claimMission.isPending} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary-500" />
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState icon={<History className="w-9 h-9 text-theme-muted" />} title="No transactions yet" description="Your coin activity will show up here." />
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const positive = tx.amount >= 0;
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-theme-secondary border border-theme"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-xl',
                            positive ? 'bg-theme-success/15 text-theme-success' : 'bg-theme-danger/15 text-theme-danger'
                          )}
                        >
                          {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-theme-primary">
                            {TX_TYPE_LABEL[tx.type] || tx.description}
                          </p>
                          <p className="text-xs text-theme-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatRelativeTime(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-sm font-semibold', positive ? 'text-theme-success' : 'text-theme-danger')}>
                          {positive ? '+' : ''}
                          {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-theme-muted">Bal: {tx.balanceAfter.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {txPageData && txPageData.pages > 1 && (
                <div className="flex justify-center mt-5">
                  <Pagination currentPage={txPage} totalPages={txPageData.pages} onPageChange={setTxPage} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <RewardPopup
        isOpen={reward !== null}
        onClose={() => setReward(null)}
        amount={reward?.amount ?? 0}
        title={reward?.title}
        description={reward?.description}
      />
    </DashboardLayout>
  );
}
