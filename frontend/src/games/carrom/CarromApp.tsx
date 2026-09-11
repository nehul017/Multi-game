'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useSocketStore } from '@/store/socket.store';
import { useChatSocket, useGameSocket } from '@/socket/hooks';
import { useGameClient } from '@/games/sdk';
import { SOCKET_EVENTS } from '@/constants/socket';
import { toId } from '@/lib/id';
import { isCarromMuted, playCarromSound, setCarromMuted } from './audio';
import { CarromHub } from './CarromHub';
import { CarromFooter } from './components/CarromFooter';
import { CarromHeader } from './components/CarromHeader';
import { CarromOverlays } from './components/CarromOverlays';
import { CarromPlayerCard } from './components/CarromPlayerCard';
import type { CarromBoardState, CarromColor, CarromShotInput } from './types';
import './carrom.css';

const CarromCanvas = dynamic(() => import('./phaser/CarromCanvas'), { ssr: false });

interface CarromAppProps {
  variant: 'hub' | 'play';
}

export function CarromApp({ variant }: CarromAppProps) {
  if (variant === 'hub') {
    return <CarromHub />;
  }
  return (
    <AuthGuard>
      <CarromPlay />
    </AuthGuard>
  );
}

const isBoard = (value: unknown): value is CarromBoardState =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as CarromBoardState).pieces));

function CarromPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const mode = searchParams.get('mode') || 'match';
  const { user } = useAuthStore();
  const { gameState, players, countdown, isMatchmaking, currentRoom } = useGameStore();
  const { joinRoom, leaveRoom, makeMove, surrender, startMatchmaking, cancelMatchmaking, fillBot, isGameConnected } =
    useGameSocket();
  useGameClient('carrom', roomParam || undefined);
  const { sendMessage, joinChatRoom, leaveChatRoom } = useChatSocket();
  const { chatOn, chatOff, chatSocket } = useSocketStore();

  const myId = toId(user?.id);
  const roomId = currentRoom?.id || '';
  const gameStatus = gameState?.status || (isMatchmaking ? 'waiting' : 'waiting');
  const board = isBoard(gameState?.board) ? gameState.board : null;
  const colors = (board?.colors || (gameState?.metadata?.colors as Record<string, CarromColor> | undefined) || {}) as Record<
    string,
    CarromColor
  >;
  const myColor: CarromColor = colors[myId] || 'white';
  const me = players.find((player) => toId(player.userId) === myId);
  const opponent = players.find((player) => toId(player.userId) !== myId);
  const opponentId = toId(opponent?.userId);
  const serverTurn = toId(gameState?.currentTurn || (gameState as { currentPlayer?: string } | null)?.currentPlayer);
  const isMyTurn = gameStatus === 'playing' && !!myId && serverTurn === myId;
  const hasBot = players.some((player) => toId(player.userId).startsWith('bot:'));
  const waiting =
    gameStatus !== 'playing' &&
    gameStatus !== 'finished' &&
    gameStatus !== 'countdown' &&
    !hasBot &&
    players.filter((player) => !toId(player.userId).startsWith('bot:')).length < 2;

  const [power, setPower] = useState(0);
  const [aiming, setAiming] = useState(false);
  const [muted, setMuted] = useState(isCarromMuted);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string }>>([]);
  const [confirm, setConfirm] = useState<{ kind: 'resign' | 'exit' | null }>({ kind: null });
  const [botEta, setBotEta] = useState(60);
  const [toast, setToast] = useState('');
  const [localShotId, setLocalShotId] = useState('');
  const fillRequested = useRef(false);
  const wasMyTurn = useRef(false);

  useEffect(() => {
    if (!isGameConnected) return;
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    const target = roomParam || stored || useGameStore.getState().currentRoom?.id;
    if (target) {
      joinRoom(target);
      return;
    }
    startMatchmaking('carrom', { pointsToWin: 5, variant: 'standard', mode });
  }, [isGameConnected, roomParam, joinRoom, startMatchmaking, mode]);

  useEffect(() => {
    return () => {
      window.setTimeout(() => {
        if (document.querySelector('[data-carrom-play]')) return;
        const active = useGameStore.getState().currentRoom?.id;
        if (active) leaveRoom(active);
        else cancelMatchmaking();
        sessionStorage.removeItem('activeGameRoom');
      }, 250);
    };
  }, [leaveRoom, cancelMatchmaking]);

  useEffect(() => {
    if (!waiting) {
      fillRequested.current = false;
      return;
    }
    setBotEta(60);
    const tick = window.setInterval(() => setBotEta((left) => Math.max(0, left - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [waiting]);

  const requestBot = useCallback(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    fillBot(roomId || stored || undefined);
  }, [fillBot, roomId]);

  useEffect(() => {
    if ((mode === 'bots' || mode === 'bot') && waiting && !fillRequested.current) {
      fillRequested.current = true;
      requestBot();
    }
  }, [mode, waiting, requestBot]);

  useEffect(() => {
    if (!waiting || botEta > 0 || fillRequested.current) return;
    fillRequested.current = true;
    requestBot();
  }, [waiting, botEta, requestBot]);

  useEffect(() => {
    if (!roomId || !chatSocket?.connected) return;
    joinChatRoom(roomId);
    return () => leaveChatRoom(roomId);
  }, [roomId, chatSocket?.connected, joinChatRoom, leaveChatRoom]);

  useEffect(() => {
    if (!roomId) return;
    const handle = (raw: unknown) => {
      const msg = raw as { content?: string; sender?: { username?: string } | string; room?: string };
      if (msg.room && msg.room !== roomId) return;
      const text = msg.content?.trim();
      if (!text) return;
      const username = typeof msg.sender === 'object' ? msg.sender?.username || 'Player' : 'Player';
      setChatMessages((prev) => [...prev, { user: username, text }]);
    };
    chatOn(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handle);
    return () => chatOff(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handle);
  }, [roomId, chatOn, chatOff]);

  useEffect(() => {
    const message = board?.foulMessage || board?.statusMessage || '';
    if (!message) return;
    setToast(message);
    if (board?.foul) playCarromSound('foul');
    else if (board?.queenStatus === 'pending-cover') playCarromSound('queen');
    else if (message === 'Turn changed') playCarromSound('turn');
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [board?.foulMessage, board?.statusMessage, board?.foul, board?.queenStatus, gameState?.moveCount]);

  const onAim = useCallback((nextPower: number, _angle: number, active: boolean) => {
    setPower(nextPower);
    setAiming(active);
  }, []);

  const onShoot = useCallback(
    (input: CarromShotInput) => {
      if (!roomId) return;
      setLocalShotId(input.shotId);
      makeMove({
        roomId,
        action: 'shoot',
        moveData: { ...input, action: 'shoot' },
      });
    },
    [roomId, makeMove]
  );

  useEffect(() => {
    if (isMyTurn && !wasMyTurn.current && gameStatus === 'playing' && (gameState?.moveCount || 0) > 0) {
      setToast('Your turn');
      playCarromSound('turn');
    }
    wasMyTurn.current = isMyTurn;
  }, [isMyTurn, gameStatus, gameState?.moveCount]);

  const pocketedFor = (color: CarromColor): number => {
    if (!board) return 0;
    return board.pieces.filter((piece) => piece.kind === color && piece.pocketed).length;
  };

  const leftOnBoard = (kind: 'white' | 'black'): number =>
    board ? board.pieces.filter((piece) => piece.kind === kind && !piece.pocketed).length : 9;

  const result = useMemo(() => {
    if (gameStatus !== 'finished') return null;
    if (!gameState?.winner) return 'draw' as const;
    return toId(gameState.winner) === myId ? ('victory' as const) : ('defeat' as const);
  }, [gameStatus, gameState?.winner, myId]);

  useEffect(() => {
    if (result === 'victory') playCarromSound('win');
  }, [result]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setCarromMuted(next);
  };

  const leaveTable = () => {
    if (roomId) leaveRoom(roomId);
    router.push('/games/carrom');
  };

  if (!isGameConnected) {
    return (
      <div className="carrom-root">
        <div className="carrom-connecting">
          <p className="carrom-brand-title">CARROM</p>
          <p>Connecting to the table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carrom-root" data-carrom-play>
      <div className="carrom-plant" aria-hidden />
      <div className="carrom-book" aria-hidden />
      <div className="carrom-stage">
        <CarromHeader
          muted={muted}
          onToggleMute={toggleMute}
          onOpenSettings={() => setSettingsOpen((open) => !open)}
          pointsLabel={`${board?.pointsToWin || 5} Points`}
        />

        <div className="carrom-board-wrap">
          <div className="carrom-players-mobile">
            <CarromPlayerCard
              name={me?.username || user?.username || 'You'}
              avatar={me?.avatar || user?.avatar}
              score={board?.scores?.[myId] || 0}
              coins={pocketedFor(myColor)}
              side="left"
              active={isMyTurn}
            />
            <CarromPlayerCard
              name={opponent?.username || (waiting ? 'Waiting...' : 'Opponent')}
              avatar={opponent?.avatar}
              score={board?.scores?.[opponentId] || 0}
              coins={pocketedFor(myColor === 'white' ? 'black' : 'white')}
              side="right"
              active={gameStatus === 'playing' && !isMyTurn && !!opponent}
              connected={!!opponent}
            />
          </div>

          <CarromPlayerCard
            name={me?.username || user?.username || 'You'}
            avatar={me?.avatar || user?.avatar}
            score={board?.scores?.[myId] || 0}
            coins={pocketedFor(myColor)}
            side="left"
            active={isMyTurn}
          />
          <CarromPlayerCard
            name={opponent?.username || (waiting ? 'Waiting...' : 'Opponent')}
            avatar={opponent?.avatar}
            score={board?.scores?.[opponentId] || 0}
            coins={pocketedFor(myColor === 'white' ? 'black' : 'white')}
            side="right"
            active={gameStatus === 'playing' && !isMyTurn && !!opponent}
            connected={!!opponent}
          />

          <div className="carrom-board-slot">
            <CarromCanvas
              board={board}
              myColor={myColor}
              inputEnabled={isMyTurn && (board?.phase || 'aiming') === 'aiming'}
              localShotId={localShotId}
              onAim={onAim}
              onShoot={onShoot}
            />
          </div>
        </div>

        <CarromFooter
          whiteLeft={leftOnBoard('white')}
          blackLeft={leftOnBoard('black')}
          queenLeft={!board?.pocketedCounts.queen}
          power={power}
          aiming={aiming}
          hint={
            gameStatus === 'playing' && !isMyTurn
              ? 'Opponent is playing'
              : aiming
                ? 'Release to Strike'
                : isMyTurn
                  ? 'Your turn — drag to aim'
                  : undefined
          }
        />
      </div>

      <CarromOverlays
        statusText={toast}
        showStatus={Boolean(toast)}
        countdown={gameStatus === 'countdown' ? countdown : null}
        waiting={waiting}
        botEta={botEta}
        onFillBot={requestBot}
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        muted={muted}
        onToggleMute={toggleMute}
        onResign={() => setConfirm({ kind: 'resign' })}
        onExit={() => setConfirm({ kind: 'exit' })}
        onRematch={() => startMatchmaking('carrom', { pointsToWin: 5, mode: 'match' })}
        canResign={gameStatus === 'playing'}
        confirm={confirm}
        onConfirm={() => {
          if (confirm.kind === 'resign' && roomId) surrender(roomId);
          else leaveTable();
          setConfirm({ kind: null });
        }}
        onCancelConfirm={() => setConfirm({ kind: null })}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((open) => !open)}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInput={setChatInput}
        onSendChat={() => {
          const text = chatInput.trim();
          if (!text) return;
          setChatMessages((prev) => [...prev, { user: user?.username || 'You', text }]);
          if (roomId) sendMessage(roomId, text);
          setChatInput('');
        }}
        result={result}
        resultDetail={board?.statusMessage}
      />
    </div>
  );
}
