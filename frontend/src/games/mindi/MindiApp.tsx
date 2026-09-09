'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useGameSocket } from '@/socket/hooks';
import { useGameClient } from '@/games/sdk';
import { toId } from '@/lib/id';
import { MindiTable } from './MindiTable';
import { MindiHub } from './components/MindiHub';
import { MindiLoading } from './components/MindiLoading';
import type { BotDifficulty } from './types';

interface MindiAppProps {
  variant: 'hub' | 'play';
}

export function MindiApp({ variant }: MindiAppProps) {
  if (variant === 'hub') return <MindiHub />;
  return (
    <AuthGuard>
      <MindiPlay />
    </AuthGuard>
  );
}

function MindiPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const mode = searchParams.get('mode') || 'match';
  const difficulty = (searchParams.get('difficulty') || 'medium') as BotDifficulty;
  const { user } = useAuthStore();
  const { gameState, players, countdown, isMatchmaking, currentRoom } = useGameStore();
  const { joinRoom, leaveRoom, makeMove, surrender, startMatchmaking, cancelMatchmaking, fillBot, isGameConnected } =
    useGameSocket();
  useGameClient('mindi', roomParam || undefined);

  const myId = toId(user?.id);
  const roomId = currentRoom?.id || '';
  const gameStatus = gameState?.status || (isMatchmaking ? 'waiting' : 'waiting');
  const hasBots = players.some((player) => toId(player.userId).startsWith('bot:'));
  const humanCount = players.filter((player) => !toId(player.userId).startsWith('bot:')).length;
  const waiting = gameStatus !== 'playing' && gameStatus !== 'finished' && gameStatus !== 'countdown' && players.length < 4;
  const instantBots = mode === 'bots';
  const fillRequested = useRef(false);
  const [botEta, setBotEta] = useState(60);

  const isMyTurn = useMemo(() => {
    if (gameStatus !== 'playing' || !myId) return false;
    return toId(gameState?.currentTurn) === myId;
  }, [gameStatus, myId, gameState?.currentTurn]);

  useEffect(() => {
    if (!isGameConnected) return;
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    const target = roomParam || stored || useGameStore.getState().currentRoom?.id;
    if (target) {
      joinRoom(target);
      return;
    }
    startMatchmaking('mindi', { botDifficulty: difficulty, mode });
  }, [isGameConnected, roomParam, joinRoom, startMatchmaking, difficulty, mode]);

  const requestBots = useCallback(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    fillBot(roomId || stored || undefined);
  }, [fillBot, roomId]);

  useEffect(() => {
    if (!waiting || instantBots) return;
    setBotEta(60);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setBotEta(Math.max(0, 60 - Math.floor((Date.now() - started) / 1000)));
    }, 250);
    return () => window.clearInterval(tick);
  }, [waiting, instantBots]);

  useEffect(() => {
    if (!waiting) {
      fillRequested.current = false;
      return;
    }
    if (fillRequested.current || players.length >= 4) return;
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    const target = roomId || stored;
    if (!instantBots && botEta > 0) return;
    if (!target && !instantBots) return;
    fillRequested.current = true;
    requestBots();
  }, [waiting, instantBots, botEta, players.length, roomId, requestBots]);

  useEffect(() => {
    return () => {
      const active = useGameStore.getState().currentRoom?.id;
      if (active) leaveRoom(active);
      else cancelMatchmaking();
      if (typeof window !== 'undefined') sessionStorage.removeItem('activeGameRoom');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playCard = (cardId: string) => {
    if (!roomId) return;
    makeMove({ roomId, action: 'play-card', moveData: { action: 'play-card', cardId } });
  };

  const loadingPhase = !isGameConnected
    ? 'connecting'
    : isMatchmaking && !currentRoom && mode === 'match'
      ? 'matchmaking'
      : waiting
        ? 'waiting'
        : gameStatus === 'countdown'
          ? 'dealing'
          : 'shuffling';

  if (!isGameConnected || (isMatchmaking && !currentRoom && mode === 'match')) {
    return (
      <div className="mindi-root">
        <div className="mindi-ambience" aria-hidden />
        <PlayNav />
        <MindiLoading
          phase={loadingPhase}
          detail={
            !isGameConnected
              ? 'Establishing the game connection'
              : instantBots
                ? 'Opening a practice table'
                : `Looking for players · bots join in ${botEta}s`
          }
          action={
            isGameConnected ? (
              <Button variant="primary" onClick={requestBots}>
                Play with Bots
              </Button>
            ) : null
          }
        />
      </div>
    );
  }

  return (
    <div className={`mindi-root ${gameStatus === 'playing' || gameStatus === 'finished' ? 'is-live' : ''}`}>
      <div className="mindi-ambience" aria-hidden />
      {gameStatus === 'countdown' && countdown !== null && (
        <div className="mindi-countdown" style={{ background: 'var(--overlay)' }}>
          <motion.span
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mindi-countdown-num"
          >
            {countdown || 'GO'}
          </motion.span>
        </div>
      )}
      <PlayNav
        waiting={waiting}
        status={
          waiting
            ? `Waiting ${Math.max(players.length, 1)}/4 · bots in ${botEta}s`
            : hasBots
              ? `${humanCount} human${humanCount === 1 ? '' : 's'} at the table`
              : 'Four-player match'
        }
        action={
          waiting ? (
            <button type="button" className="mindi-nav-fill" onClick={requestBots}>
              Fill empty seats
            </button>
          ) : null
        }
      />
      {waiting && players.length < 2 ? (
        <MindiLoading
          phase="waiting"
          detail={
            instantBots
              ? 'Seating bots at the table'
              : `If nobody else sits, bots join in ${botEta}s`
          }
          action={
            <Button variant="primary" onClick={requestBots}>
              Fill empty seats with bots
            </Button>
          }
        />
      ) : (
      <MindiTable
        board={gameState?.board}
        players={players.map((player) => ({
          userId: toId(player.userId),
          username: player.username,
          avatar: player.avatar,
          connected: player.isReady !== false,
        }))}
        currentUserId={myId}
        disabled={gameStatus !== 'playing' || !isMyTurn}
        isMyTurn={isMyTurn}
        gameStatus={gameStatus}
        onPlayCard={playCard}
        onSurrender={() => roomId && surrender(roomId)}
        onPlayAgain={() => startMatchmaking('mindi', { botDifficulty: difficulty, mode: 'bots' })}
        onExit={() => router.push('/games/mindi')}
      />
      )}
    </div>
  );
}

function PlayNav({
  waiting,
  status,
  action,
}: {
  waiting?: boolean;
  status?: string;
  action?: ReactNode;
}) {
  return (
    <nav className="mindi-nav">
      <Link href="/games/mindi" className="mindi-nav-back">
        <ArrowLeft className="w-4 h-4" />
        Lobby
      </Link>
      <p className="mindi-nav-brand">
        <span aria-hidden>♠</span>
        Mindi Cot
      </p>
      <div className="mindi-nav-meta">
        {status && <em>{status}</em>}
        {waiting && action}
      </div>
    </nav>
  );
}
