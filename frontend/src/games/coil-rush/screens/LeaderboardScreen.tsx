'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useFriends, useLeaderboard } from '@/hooks';
import { toId } from '@/lib/id';
import type { Friend, LeaderboardEntry } from '@/types';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const PERIODS = [
  { id: 'all' as const, label: 'Global' },
  { id: 'daily' as const, label: 'Today' },
  { id: 'weekly' as const, label: 'Weekly' },
];

function asRows(data: unknown): LeaderboardEntry[] {
  const payload = data as { data?: LeaderboardEntry[] } | LeaderboardEntry[] | undefined;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('all');
  const [tab, setTab] = useState<'global' | 'friends'>('global');
  const { user } = useAuthStore();
  const { data } = useLeaderboard(period, 'snake-multiplayer', 1);
  const { data: friendsRes } = useFriends();
  const rows = asRows(data?.data);
  const friendPayload = friendsRes?.data as unknown;
  const friends = (Array.isArray(friendPayload) ? friendPayload : (friendPayload as { data?: Friend[] })?.data ?? []) as Friend[];

  const friendRows = useMemo(() => {
    const byName = new Map(rows.map((row) => [row.username, row]));
    return [...friends]
      .map((friend, index) => {
        const live = byName.get(friend.username);
        return {
          rank: live?.rank ?? index + 1,
          username: friend.username,
          elo: live?.elo ?? friend.elo ?? 0,
          userId: toId(friend.userId || friend.id),
          avatar: friend.avatar,
        };
      })
      .sort((a, b) => b.elo - a.elo)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [friends, rows]);

  const shown = tab === 'friends' ? friendRows : rows.slice(0, 20);

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Coil ranks</h2>
      <div className="coil-cats">
        <button type="button" className={tab === 'global' ? 'is-on' : ''} onClick={() => setTab('global')}>Global</button>
        <button type="button" className={tab === 'friends' ? 'is-on' : ''} onClick={() => setTab('friends')}>Friends</button>
        {PERIODS.map((item) => (
          <button key={item.id} type="button" className={period === item.id ? 'is-on' : ''} onClick={() => setPeriod(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <ol className="coil-rank-list">
        {shown.map((row) => (
          <li key={`${row.rank}-${row.username}`} className={row.username === user?.username ? 'is-me' : ''}>
            <b>#{row.rank}</b>
            <span>{row.username}</span>
            <em>{row.elo}</em>
          </li>
        ))}
        {shown.length === 0 && (
          <p className="coil-empty">
            {tab === 'friends' ? 'Add friends, then play Coil Rush to rank against them.' : 'No ranks yet — be the first current.'}
          </p>
        )}
      </ol>
    </section>
  );
}
