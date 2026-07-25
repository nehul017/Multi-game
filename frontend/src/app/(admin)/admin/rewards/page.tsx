'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Target, Plus, Pencil, Trash2, Coins, Send } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useAdminMissions,
  useCreateMission,
  useUpdateMission,
  useDeleteMission,
  useAdjustUserCoins,
} from '@/hooks';
import type { AdminMission, MissionConditionType, MissionType } from '@/types';

const TYPE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const CONDITION_OPTIONS = [
  { value: 'wins', label: 'Wins' },
  { value: 'games_played', label: 'Games Played' },
  { value: 'login', label: 'Login' },
  { value: 'friends_added', label: 'Friends Added' },
  { value: 'spend_coins', label: 'Coins Spent' },
  { value: 'earn_coins', label: 'Coins Earned' },
];

const MISSION_FORM_DEFAULT = {
  title: '',
  description: '',
  type: 'daily' as MissionType,
  conditionType: 'wins' as MissionConditionType,
  conditionValue: '1',
  gameType: '',
  coinReward: '50',
  xpReward: '0',
};

export default function AdminRewardsPage() {
  const [missionModal, setMissionModal] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [missionForm, setMissionForm] = useState(MISSION_FORM_DEFAULT);

  const [coinsForm, setCoinsForm] = useState({ userId: '', amount: '', reason: '' });

  const { data: missionsRes, isLoading: missionsLoading, isError: missionsError, refetch: refetchMissions } = useAdminMissions();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const adjustCoins = useAdjustUserCoins();

  const missions = missionsRes?.data.data ?? [];

  const openCreateMission = () => {
    setMissionForm(MISSION_FORM_DEFAULT);
    setMissionModal({ mode: 'create' });
  };

  const openEditMission = (mission: AdminMission) => {
    setMissionForm({
      title: mission.title,
      description: mission.description,
      type: mission.type,
      conditionType: mission.condition.type,
      conditionValue: String(mission.condition.value),
      gameType: mission.condition.gameType || '',
      coinReward: String(mission.coinReward),
      xpReward: String(mission.xpReward),
    });
    setMissionModal({ mode: 'edit', id: mission._id });
  };

  const handleMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: missionForm.title.trim(),
      description: missionForm.description.trim(),
      type: missionForm.type,
      condition: {
        type: missionForm.conditionType,
        value: Number(missionForm.conditionValue),
        ...(missionForm.gameType.trim() ? { gameType: missionForm.gameType.trim() } : {}),
      },
      coinReward: Number(missionForm.coinReward),
      xpReward: Number(missionForm.xpReward),
    };
    if (!payload.title || !payload.description) return;

    if (missionModal?.mode === 'create') {
      createMission.mutate(payload, { onSuccess: () => setMissionModal(null) });
    } else if (missionModal?.id) {
      updateMission.mutate({ id: missionModal.id, data: payload }, { onSuccess: () => setMissionModal(null) });
    }
  };

  const handleAdjustCoins = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(coinsForm.amount);
    if (!coinsForm.userId.trim() || !amount) return;
    adjustCoins.mutate(
      { userId: coinsForm.userId.trim(), amount, reason: coinsForm.reason.trim() || 'Admin adjustment' },
      { onSuccess: () => setCoinsForm({ userId: '', amount: '', reason: '' }) }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-theme-primary">Rewards &amp; Missions</h1>
          <p className="text-theme-muted mt-1">Manage missions and adjust player coin balances</p>
        </motion.div>

        {/* Adjust User Coins */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary-500" />
            <CardTitle>Adjust User Coins</CardTitle>
          </CardHeader>
          <form onSubmit={handleAdjustCoins} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr_auto] gap-4 items-end">
            <Input
              label="User ID"
              placeholder="e.g. 64f1c2..."
              value={coinsForm.userId}
              onChange={(e) => setCoinsForm({ ...coinsForm, userId: e.target.value })}
              required
            />
            <Input
              label="Amount"
              type="number"
              placeholder="e.g. 500 or -200"
              value={coinsForm.amount}
              onChange={(e) => setCoinsForm({ ...coinsForm, amount: e.target.value })}
              required
            />
            <Input
              label="Reason"
              placeholder="e.g. Compensation for bug"
              value={coinsForm.reason}
              onChange={(e) => setCoinsForm({ ...coinsForm, reason: e.target.value })}
            />
            <Button type="submit" isLoading={adjustCoins.isPending} leftIcon={<Send className="w-4 h-4" />}>
              Apply
            </Button>
          </form>
          <p className="text-xs text-theme-muted mt-3">Use a positive amount to grant coins, negative to deduct.</p>
        </Card>

        {/* Missions */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" />
              <CardTitle>Missions</CardTitle>
            </div>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateMission} className="w-full sm:w-auto">
              Add Mission
            </Button>
          </div>

          {missionsError ? (
            <ErrorState title="Failed to load missions" onRetry={refetchMissions} />
          ) : missionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : missions.length === 0 ? (
            <EmptyState icon={<Gift className="w-9 h-9 text-theme-muted" />} title="No missions yet" description="Create a mission to reward players." action={{ label: 'Add Mission', onClick: openCreateMission }} />
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <div key={mission._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-theme-secondary border border-theme">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-primary-500/15 border border-primary-500/20 shrink-0">
                      <Target className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-theme-primary">{mission.title}</p>
                        <Badge variant={mission.type === 'daily' ? 'info' : 'purple'} size="sm">{mission.type}</Badge>
                      </div>
                      <p className="text-xs text-theme-muted mt-0.5 break-words">
                        {mission.description} · {mission.condition.value} {mission.condition.type.replace('_', ' ')}
                        {mission.condition.gameType ? ` (${mission.condition.gameType})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-11 sm:pl-0">
                    <span className="text-sm font-semibold text-amber-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {mission.coinReward}
                    </span>
                    <Switch
                      checked={mission.isActive}
                      onChange={(checked) => updateMission.mutate({ id: mission._id, data: { isActive: checked } })}
                    />
                    <Button variant="outline" size="sm" onClick={() => openEditMission(mission)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => confirm(`Delete mission "${mission.title}"?`) && deleteMission.mutate(mission._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Modal isOpen={missionModal !== null} onClose={() => setMissionModal(null)} title={missionModal?.mode === 'edit' ? 'Edit Mission' : 'Add Mission'} size="md">
          <form className="space-y-4" onSubmit={handleMissionSubmit}>
            <Input label="Title" value={missionForm.title} onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-theme-muted mb-1.5">Description</label>
              <textarea
                className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 min-h-[70px] resize-y"
                value={missionForm.description}
                onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" options={TYPE_OPTIONS} value={missionForm.type} onChange={(e) => setMissionForm({ ...missionForm, type: e.target.value as MissionType })} />
              <Select
                label="Condition"
                options={CONDITION_OPTIONS}
                value={missionForm.conditionType}
                onChange={(e) => setMissionForm({ ...missionForm, conditionType: e.target.value as MissionConditionType })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Target Value" type="number" min={1} value={missionForm.conditionValue} onChange={(e) => setMissionForm({ ...missionForm, conditionValue: e.target.value })} required />
              <Input label="Game Type (optional)" placeholder="e.g. chess" value={missionForm.gameType} onChange={(e) => setMissionForm({ ...missionForm, gameType: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Coin Reward" type="number" min={0} value={missionForm.coinReward} onChange={(e) => setMissionForm({ ...missionForm, coinReward: e.target.value })} required />
              <Input label="XP Reward" type="number" min={0} value={missionForm.xpReward} onChange={(e) => setMissionForm({ ...missionForm, xpReward: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setMissionModal(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={createMission.isPending || updateMission.isPending}>
                {missionModal?.mode === 'edit' ? 'Save Changes' : 'Create Mission'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
