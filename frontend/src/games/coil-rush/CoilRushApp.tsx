'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useSocketStore } from '@/store/socket.store';
import { useGameSocket } from '@/socket/hooks';
import { SOCKET_EVENTS } from '@/constants/socket';
import { useClaimDailyLogin, useDailyLoginStatus, useWallet } from '@/hooks';
import { toId } from '@/lib/id';
import { COIL_BRAND } from './brand';
import { coilAudio } from './audio/audioService';
import { coilProgress } from './progression/storage';
import { closeRun } from './progression/rewards';
import { createCoilNetwork } from './net/session';
import { createCoilInput } from './net/input';
import { coilLive } from './net/liveBoard';
import { CoilArena } from './render/CoilArena';
import { PlayHud } from './hud/PlayHud';
import { HubMenu } from './screens/HubMenu';
import { ModesScreen } from './screens/ModesScreen';
import { SkinsScreen } from './screens/SkinsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { MissionsScreen } from './screens/MissionsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { RoomsScreen } from './screens/RoomsScreen';
import type { CoilMode, CoilRunStats, CoilView } from './types';

interface CoilRushAppProps {
  variant: 'hub' | 'play';
}

const VIEWS = new Set<CoilView>(['menu', 'modes', 'skins', 'leaderboard', 'missions', 'profile', 'settings', 'rooms']);
const MODES = new Set<CoilMode>(['classic', 'time-rush', 'survival', 'teams', 'boss', 'friends']);

function readQuery(): { view: CoilView; mode: CoilMode; room: string } {
  if (typeof window === 'undefined') return { view: 'menu', mode: 'classic', room: '' };
  const q = new URLSearchParams(window.location.search);
  const view = q.get('view') as CoilView;
  const mode = q.get('mode') as CoilMode;
  return {
    view: VIEWS.has(view) ? view : 'menu',
    mode: MODES.has(mode) ? mode : 'classic',
    room: q.get('room') || '',
  };
}

export function CoilRushApp({ variant }: CoilRushAppProps) {
  return (
    <AuthGuard>
      <CoilRushInner variant={variant} />
    </AuthGuard>
  );
}

function CoilRushInner({ variant }: CoilRushAppProps) {
  const router = useRouter();
  const query = readQuery();
  const { user } = useAuthStore();
  const status = useGameStore((s) => s.gameState?.status);
  const players = useGameStore((s) => s.players);
  const roomId = useGameStore((s) => s.currentRoom?.id);
  const isMatchmaking = useGameStore((s) => s.isMatchmaking);
  const { startMatchmaking, cancelMatchmaking, makeMove, joinRoom } = useGameSocket();
  const { data: walletRes } = useWallet();
  const { data: dailyRes } = useDailyLoginStatus();
  const claimDaily = useClaimDailyLogin();

  const [view, setView] = useState<CoilView>(query.view);
  const [mode, setMode] = useState<CoilMode>(query.mode);
  const [skin, setSkin] = useState(coilProgress.getSkin());
  const [over, setOver] = useState<CoilRunStats | null>(null);
  const sessionStarted = useRef(false);
  const foodCue = useRef(0);
  const died = useRef(false);
  const input = useRef(createCoilInput()).current;

  const myId = toId(user?.id);
  const playing = variant === 'play' && status === 'playing';
  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const player of players) map[toId(player.userId)] = player.username;
    return map;
  }, [players]);

  const net = useMemo(
    () =>
      createCoilNetwork({
        startMatchmaking,
        joinRoom,
        makeMove,
        cancelMatchmaking,
        slug: COIL_BRAND.slug,
        playerId: myId,
      }),
    [startMatchmaking, joinRoom, makeMove, cancelMatchmaking, myId]
  );

  useEffect(() => {
    if (variant !== 'play') return;

    const tryStart = () => {
      if (sessionStarted.current || !useSocketStore.getState().isGameConnected) return;
      sessionStarted.current = true;
      if (query.room) {
        joinRoom(query.room);
        return;
      }
      startMatchmaking(COIL_BRAND.slug, {
        mode,
        botCount: mode === 'friends' ? 0 : undefined,
        skinByPlayer: myId ? { [myId]: skin } : {},
      });
    };

    tryStart();
    const unsub = useSocketStore.subscribe((state) => {
      if (state.isGameConnected) tryStart();
    });

    return () => {
      unsub();
      sessionStarted.current = false;
      const roomId = useGameStore.getState().currentRoom?.id;
      if (roomId) {
        useSocketStore.getState().gameEmit(SOCKET_EVENTS.GAME.LEAVE_ROOM, { roomId });
      } else {
        useSocketStore.getState().gameEmit(SOCKET_EVENTS.GAME.CANCEL_MATCHMAKING);
      }
      useGameStore.getState().resetGame();
    };
    // Own the play session for this mount only. Do not depend on socket callback
    // identities — those retrigger resetGame and overflow React's update depth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  useEffect(() => {
    if (!playing || over) return;
    return coilLive.subscribe((board) => {
      const me = (board.snakes || []).find((s) => s.playerId === myId);
      const eaten = me?.foodEaten || 0;
      if (eaten > foodCue.current) coilAudio.play('food');
      foodCue.current = eaten;
      if (!me || me.alive) {
        died.current = false;
        return;
      }
      if (died.current) return;
      died.current = true;
      const ranked = [...(board.snakes || [])].sort((a, b) => b.score - a.score);
      setOver(
        closeRun({
          score: me.score,
          length: me.body.length,
          rank: ranked.findIndex((s) => s.playerId === me.playerId) + 1,
          timeMs: board.elapsedMs || 0,
          foodEaten: me.foodEaten || 0,
          kills: me.kills || 0,
        })
      );
      coilAudio.play('death');
    });
  }, [playing, over, myId]);

  const steer = useCallback(
    (input: { angle: number; boost: boolean }) => {
      const roomId = useGameStore.getState().currentRoom?.id;
      if (!roomId) return;
      net.steer(roomId, input);
    },
    [net]
  );

  const goPlay = (nextMode = mode) => {
    coilAudio.play('click');
    router.push(`/games/${COIL_BRAND.slug}/play?mode=${nextMode}`);
  };

  const coins = walletRes?.data?.coins ?? user?.coins ?? 0;
  const dailyReady = dailyRes?.data ? !dailyRes.data.claimedToday : false;

  const body = useMemo(() => {
    if (variant === 'play') {
      return (
        <>
          <CoilArena
            currentUserId={myId}
            playing={playing && !over}
            disabled={!playing || Boolean(over)}
            input={input}
            onSteer={steer}
          />
          <PlayHud
            username={user?.username}
            avatar={user?.avatar}
            currentUserId={myId}
            names={names}
            input={input}
          />
          {!playing && !over && (
            <div className="coil-overlay">
              <section className="coil-card coil-over">
                <h2>{isMatchmaking ? 'Finding a current' : 'Entering the ring'}</h2>
                <p className="coil-empty">Bots fill the arena so you can play immediately.</p>
              </section>
            </div>
          )}
          {over && (
            <GameOverScreen
              stats={over}
              onAgain={() => {
                const live = coilLive.get();
                if (live.mode === 'survival' || status === 'finished' || !roomId) {
                  sessionStarted.current = false;
                  net.findMatch({ mode, skinId: skin });
                } else {
                  net.respawn(roomId);
                }
                died.current = false;
                setOver(null);
              }}
              onHome={() => router.push(`/games/${COIL_BRAND.slug}`)}
              onSkins={() => router.push(`/games/${COIL_BRAND.slug}?view=skins`)}
              onLeaderboard={() => router.push(`/games/${COIL_BRAND.slug}?view=leaderboard`)}
            />
          )}
        </>
      );
    }

    if (view === 'modes') {
      return (
        <ModesScreen
          current={mode}
          onBack={() => setView('menu')}
          onSelect={(next) => {
            setMode(next);
            goPlay(next);
          }}
        />
      );
    }
    if (view === 'rooms') {
      return <RoomsScreen onBack={() => setView('menu')} onCreate={() => goPlay('friends')} />;
    }
    if (view === 'skins') {
      return (
        <SkinsScreen
          equipped={skin}
          onBack={() => setView('menu')}
          onEquip={(id) => {
            coilProgress.setSkin(id);
            setSkin(id);
            coilAudio.play('click');
          }}
        />
      );
    }
    if (view === 'leaderboard') return <LeaderboardScreen onBack={() => setView('menu')} />;
    if (view === 'missions') return <MissionsScreen onBack={() => setView('menu')} />;
    if (view === 'profile') return <ProfileScreen onBack={() => setView('menu')} />;
    if (view === 'settings') return <SettingsScreen onBack={() => setView('menu')} />;

    return (
      <HubMenu
        username={user?.username}
        coins={coins}
        dailyReady={dailyReady}
        onPlay={() => goPlay(mode)}
        onOpen={setView}
        onDaily={() => dailyReady && claimDaily.mutate()}
        onDashboard={() => router.push('/dashboard')}
      />
    );
  }, [
    variant,
    view,
    mode,
    skin,
    myId,
    playing,
    over,
    steer,
    user,
    names,
    roomId,
    coins,
    dailyReady,
    claimDaily,
    net,
    status,
    isMatchmaking,
    input,
    router,
  ]);

  return <div className="coil-root">{body}</div>;
}
