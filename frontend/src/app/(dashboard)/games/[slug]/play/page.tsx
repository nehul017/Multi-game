'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, RotateCcw, MessageSquare, Eye, Clock, Loader2, Send, Swords, Bot } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GamesBreadcrumb } from '@/components/games/GamesBreadcrumb';
import { formatGameTitle } from '@/types/home';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TicTacToeBoard } from '@/components/game/TicTacToeBoard';
import { ConnectFourBoard } from '@/components/game/ConnectFourBoard';
import { ChessBoard } from '@/components/game/ChessBoard';
import { SnakeBoard } from '@/components/game/SnakeBoard';
import { CoilRushApp } from '@/games/coil-rush/CoilRushApp';
import { ChessApp } from '@/games/chess-arena';
import { BlockMasterApp } from '@/games/block-master';
import { FruitSlotsApp } from '@/games/classic-fruit-slots';
import { PokerApp } from '@/games/poker';
import { MindiApp } from '@/games/mindi';
import { PuzzleWorldApp } from '@/games/puzzle-world';
import { JigsawWorldApp } from '@/games/jigsaw-world';
import { BottleShooterApp } from '@/games/bottle-shooter-3d';
import { LudoBoard } from '@/components/game/LudoBoard';
import { QuizBattleBoard } from '@/components/game/QuizBattleBoard';
import { GameOverModal } from '@/components/game/GameOverModal';
import { GameChat } from '@/components/game/GameChat';
import { SpectatorBar } from '@/components/game/SpectatorBar';
import { MoveHistory } from '@/components/game/MoveHistory';
import { PlayerPanel } from '@/components/game/PlayerPanel';
import {
  ChessArena,
  ChessCaptured,
  ChessStatus,
  type ChessStatusKind,
} from '@/components/game/chess';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useSocketStore } from '@/store/socket.store';
import { useGameSocket, useChatSocket, useGameTimer } from '@/socket/hooks';
import { useGameClient } from '@/games/sdk';
import { SOCKET_EVENTS } from '@/constants/socket';
import { toId } from '@/lib/id';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function PlayerBar({
  username,
  elo,
  timeLeft,
  isActive,
  align,
}: {
  username: string;
  elo: string | number;
  timeLeft: string;
  isActive: boolean;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'game-panel flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all duration-300 min-w-0',
        isActive && 'game-panel-active',
        align === 'right' && 'flex-row-reverse text-right'
      )}
    >
      <Avatar name={username} size="md" online={isActive} floating={isActive} />
      <div className={cn('flex-1 min-w-0', align === 'right' && 'items-end')}>
        <p className="text-sm font-semibold text-theme-primary truncate font-display">{username}</p>
        <p className="text-xs text-theme-muted">{elo} ELO</p>
      </div>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-mono text-xs sm:text-sm shrink-0',
          isActive
            ? 'bg-primary-500/15 text-primary-500 border border-primary-500/25'
            : 'bg-theme-secondary text-theme-muted border border-theme'
        )}
      >
        <Clock className="w-3.5 h-3.5" />
        {timeLeft}
      </div>
    </div>
  );
}

export default function PlayRoute() {
  const params = useParams();
  if ((params.slug as string) === 'snake-multiplayer' || (params.slug as string) === 'coil-rush') {
    return <CoilRushApp variant="play" />;
  }
  if ((params.slug as string) === 'chess') {
    return <ChessApp variant="play" />;
  }
  if ((params.slug as string) === 'block-master') {
    return <BlockMasterApp variant="play" />;
  }
  if ((params.slug as string) === 'classic-fruit-slots') {
    return <FruitSlotsApp variant="play" />;
  }
  if ((params.slug as string) === 'poker') {
    return <PokerApp variant="play" />;
  }
  if ((params.slug as string) === 'mindi') {
    return <MindiApp variant="play" />;
  }
  if ((params.slug as string) === 'puzzle-world') {
    return <PuzzleWorldApp variant="play" />;
  }
  if ((params.slug as string) === 'jigsaw-world') {
    return <JigsawWorldApp variant="play" />;
  }
  if ((params.slug as string) === 'bottle-shooter-3d') {
    return <BottleShooterApp variant="play" />;
  }
  return <GenericPlayPage />;
}

function GenericPlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const roomParam = searchParams.get('room');
  const { user } = useAuthStore();
  const { gameState, players, spectators, countdown, isMatchmaking, currentRoom, moveHistory } =
    useGameStore();
  const {
    joinRoom,
    leaveRoom,
    makeMove,
    surrender,
    offerDraw,
    acceptDraw,
    startMatchmaking,
    cancelMatchmaking,
    fillBot,
    isGameConnected,
  } = useGameSocket();
  useGameClient(slug, roomParam || undefined);
  const { sendMessage: sendChatMessage, joinChatRoom, leaveChatRoom } = useChatSocket();
  const { chatOn, chatOff, chatSocket } = useSocketStore();
  useGameTimer();

  const [chatMessages, setChatMessages] = useState<
    Array<{ id?: string; user: string; text: string; timestamp: number; userId?: string }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [botEta, setBotEta] = useState(60);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pendingBotFill = useRef(false);
  const botFillRequested = useRef(false);
  const quizRoundStarted = useRef(Date.now());

  const roomId = currentRoom?.id || '';
  const gameStatus = gameState?.status || (isMatchmaking ? 'waiting' : 'waiting');
  const myId = toId(user?.id);
  const me = players.find((p) => toId(p.userId) === myId);
  const opponent = players.find((p) => toId(p.userId) !== myId);
  const hasBotOpponent = players.some((p) => toId(p.userId).startsWith('bot:'));

  const isMyTurn =
    gameStatus === 'playing' &&
    !!myId &&
    (gameState?.currentTurn
      ? toId(gameState.currentTurn) === myId
      : players.length >= 2 && toId(players[(gameState?.moveCount ?? 0) % 2]?.userId) === myId);

  const supportsBotFill = slug === 'ludo' || slug === 'connect-four' || slug === 'tic-tac-toe';
  const waitingForOpponent =
    supportsBotFill &&
    gameStatus !== 'playing' &&
    gameStatus !== 'finished' &&
    gameStatus !== 'countdown' &&
    !hasBotOpponent &&
    players.filter((p) => !toId(p.userId).startsWith('bot:')).length < 2;

  const requestBotFill = useCallback(() => {
    const stored =
      typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    const target = roomId || stored || undefined;
    if (target) {
      pendingBotFill.current = false;
      fillBot(target);
      return;
    }
    pendingBotFill.current = true;
    if (isGameConnected && !isMatchmaking) {
      startMatchmaking(slug);
    }
  }, [roomId, fillBot, isGameConnected, isMatchmaking, startMatchmaking, slug]);

  useEffect(() => {
    if (!waitingForOpponent || !currentRoom?.id) return;
    setBotEta(60);
    const tick = window.setInterval(() => {
      setBotEta((left) => Math.max(0, left - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [waitingForOpponent, currentRoom?.id]);

  useEffect(() => {
    if (!waitingForOpponent) {
      botFillRequested.current = false;
      return;
    }
    if (botEta > 0 || botFillRequested.current) return;
    botFillRequested.current = true;
    requestBotFill();
  }, [waitingForOpponent, botEta, requestBotFill]);

  useEffect(() => {
    if (!isGameConnected || slug === 'snake-multiplayer') return;

    const storedRoom =
      typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null;
    const roomToJoin = roomParam || storedRoom || useGameStore.getState().currentRoom?.id;

    if (roomToJoin) {
      joinRoom(roomToJoin);
    } else {
      startMatchmaking(slug);
    }
  }, [slug, roomParam, isGameConnected, joinRoom, startMatchmaking]);

  useEffect(() => {
    if (!pendingBotFill.current || !isGameConnected) return;
    const target = currentRoom?.id;
    if (!target) return;
    pendingBotFill.current = false;
    fillBot(target);
  }, [currentRoom?.id, isGameConnected, fillBot]);

  useEffect(() => {
    return () => {
      const activeRoomId = useGameStore.getState().currentRoom?.id;
      if (activeRoomId) leaveRoom(activeRoomId);
      else cancelMatchmaking();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeGameRoom');
      }
    };
    // Unmount only. Re-running on callback identity calls resetGame in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Join the game's chat room so both players receive messages
  useEffect(() => {
    if (!roomId || !chatSocket?.connected) return;
    joinChatRoom(roomId);
    return () => leaveChatRoom(roomId);
  }, [roomId, chatSocket?.connected, joinChatRoom, leaveChatRoom]);

  // Apply incoming room chat messages to local game chat UI
  useEffect(() => {
    if (!roomId) return;

    const handleNewMessage = (raw: unknown) => {
      const msg = raw as {
        _id?: string;
        id?: string;
        room?: string;
        content?: string;
        createdAt?: string;
        sender?: { _id?: string; id?: string; username?: string } | string;
        senderId?: string;
        senderUsername?: string;
      };

      if (msg.room && msg.room !== roomId) return;

      const senderObj = typeof msg.sender === 'object' && msg.sender ? msg.sender : null;
      const senderId = toId(
        senderObj?._id || senderObj?.id || msg.senderId || (typeof msg.sender === 'string' ? msg.sender : '')
      );
      const username = senderObj?.username || msg.senderUsername || 'Player';
      const text = msg.content?.trim();
      if (!text) return;
      const id = msg._id || msg.id;
      const timestamp = msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now();

      setChatMessages((prev) => {
        if (id && prev.some((m) => m.id === id)) return prev;

        // Replace optimistic local copy of our own message
        if (senderId && senderId === myId) {
          const idx = [...prev]
            .reverse()
            .findIndex((m) => !m.id && m.userId === myId && m.text === text);
          if (idx !== -1) {
            const realIdx = prev.length - 1 - idx;
            const next = [...prev];
            next[realIdx] = { id, user: username, text, timestamp, userId: senderId };
            return next;
          }
        }

        return [...prev, { id, user: username, text, timestamp, userId: senderId || undefined }];
      });
    };

    chatOn(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleNewMessage);
    return () => chatOff(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleNewMessage);
  }, [roomId, myId, chatOn, chatOff]);

  const emitMove = (moveData: Record<string, unknown>, action = 'move') => {
    if (!roomId) return;
    makeMove({ roomId, action, moveData });
  };

  const handleTttMove = (position: { row: number; col: number } | number) => {
    if (!isMyTurn) return;
    if (typeof position === 'number') {
      emitMove({ row: Math.floor(position / 3), col: position % 3 }, 'place');
    } else {
      emitMove(position, 'place');
    }
  };

  const handleConnectFourMove = (position: { row: number; col: number } | number) => {
    if (!isMyTurn) return;
    const col = typeof position === 'number' ? position : position.col;
    emitMove({ col }, 'drop');
  };

  const handleChessMove = (move: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  }) => {
    if (!isMyTurn) return;
    emitMove(move, 'move');
  };

  const handleSnakeMove = useCallback((input: { angle: number; boost: boolean }) => {
    const room = useGameStore.getState().currentRoom?.id;
    const status = useGameStore.getState().gameState?.status;
    if (!room || status !== 'playing') return;
    makeMove({ roomId: room, action: 'steer', moveData: input });
  }, [makeMove]);

  const handleLudoRoll = () => {
    if (!isMyTurn) return;
    emitMove({ action: 'roll' }, 'roll');
  };

  const handleLudoToken = (tokenId: number) => {
    if (!isMyTurn) return;
    emitMove({ action: 'move', tokenId }, 'move');
  };

  const quizQuestionNumber = Number(
    (gameState?.board as { questionNumber?: number } | undefined)?.questionNumber || 0
  );

  useEffect(() => {
    if (slug !== 'quiz-battle') return;
    quizRoundStarted.current = Date.now();
  }, [slug, quizQuestionNumber]);

  const handleQuizAnswer = (answer: number) => {
    if (gameStatus !== 'playing') return;
    emitMove({ action: 'answer', answer, timeMs: Date.now() - quizRoundStarted.current }, 'answer');
  };

  const handleSurrender = () => {
    if (roomId) surrender(roomId);
  };

  const handleOfferDraw = () => {
    if (!roomId) return;
    offerDraw(roomId);
    toast.success('Draw offer sent');
  };

  const handleAcceptDraw = () => {
    if (!roomId) return;
    acceptDraw(roomId);
  };

  const drawOffered = Boolean(gameState?.metadata?.drawOffered);

  const handleSendChat = (text?: string) => {
    const value = (text ?? chatInput).trim();
    if (!value) return;
    setChatMessages((prev) => [
      ...prev,
      {
        user: user?.username || 'You',
        text: value,
        timestamp: Date.now(),
        userId: myId,
      },
    ]);
    if (roomId) sendChatMessage(roomId, value);
    setChatInput('');
  };

  const formatTime = (seconds?: number) => {
    if (seconds == null) return '5:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isChess = slug === 'chess';
  const isLudo = slug === 'ludo';
  const isTtt = slug === 'tic-tac-toe';
  const isSnake = slug === 'snake-multiplayer' || slug === 'coil-rush';
  const symbolMap = (gameState?.metadata?.symbols || {}) as Record<string, 'X' | 'O'>;
  const myMark: 'X' | 'O' | undefined = myId
    ? symbolMap[myId] ||
      Object.entries(symbolMap).find(([id]) => toId(id) === myId)?.[1]
    : undefined;
  const opponentMark: 'X' | 'O' | undefined =
    myMark === 'X' ? 'O' : myMark === 'O' ? 'X' : undefined;
  const inCheck = Boolean(gameState?.metadata?.inCheck);
  const colorMap = (gameState?.metadata?.colors || {}) as Record<string, 'white' | 'black'>;

  const turnColor: 'white' | 'black' | null = useMemo(() => {
    if (!gameState?.currentTurn) return null;
    const colors = (gameState.metadata?.colors || {}) as Record<string, 'white' | 'black'>;
    const turnId = toId(gameState.currentTurn);
    return colors[turnId] || colors[gameState.currentTurn] || null;
  }, [gameState?.currentTurn, gameState?.metadata]);

  const myColor: 'white' | 'black' = useMemo(() => {
    if (!myId) return 'white';
    if (colorMap[myId]) return colorMap[myId];
    const userKey = toId(user?.id);
    if (userKey && colorMap[userKey]) return colorMap[userKey];
    const matched = Object.entries(colorMap).find(([id]) => toId(id) === myId);
    if (matched) return matched[1];
    // Fallback from seat order: first player is white
    if (players[0] && toId(players[0].userId) === myId) return 'white';
    if (players[1] && toId(players[1].userId) === myId) return 'black';
    return 'white';
  }, [colorMap, myId, user?.id, players]);
  const opponentColor: 'white' | 'black' = myColor === 'white' ? 'black' : 'white';

  const checkColor: 'white' | 'black' | undefined =
    inCheck && turnColor ? turnColor : undefined;

  const chessStatus: ChessStatusKind = useMemo(() => {
    if (gameStatus === 'waiting' || gameStatus === 'countdown') return 'waiting';
    if (gameStatus === 'finished') {
      if (!gameState?.winner) return 'draw';
      if (inCheck) return 'checkmate';
      return 'resigned';
    }
    if (inCheck) return 'check';
    if (turnColor === 'white') return 'white-turn';
    if (turnColor === 'black') return 'black-turn';
    return 'playing';
  }, [gameStatus, gameState?.winner, inCheck, turnColor]);

  const myTime = gameState?.timeLeft?.[myId] ?? 300;
  const opponentTime = gameState?.timeLeft?.[toId(opponent?.userId)] ?? 300;

  const renderBoard = () => {
    const disabled = gameStatus !== 'playing' || (!isMyTurn && slug !== 'snake-multiplayer' && slug !== 'quiz-battle');
    const board = gameState?.board;

    switch (slug) {
      case 'tic-tac-toe':
        return (
          <TicTacToeBoard
            board={board}
            onMove={handleTttMove}
            disabled={disabled}
            isMyTurn={gameStatus === 'playing' ? isMyTurn : undefined}
            myMark={myMark}
          />
        );
      case 'connect-four':
        return (
          <ConnectFourBoard
            board={board}
            onMove={handleConnectFourMove}
            disabled={disabled}
            isMyTurn={gameStatus === 'playing' ? isMyTurn : undefined}
          />
        );
      case 'chess':
        return (
          <ChessBoard
            board={board}
            onMove={handleChessMove}
            disabled={disabled}
            inCheck={inCheck}
            checkColor={checkColor}
            orientation={myColor}
            playerColor={myColor}
          />
        );
      case 'snake-multiplayer':
        return (
          <SnakeBoard
            board={board}
            onMove={handleSnakeMove}
            disabled={gameStatus !== 'playing'}
            players={players.map((p) => ({
              userId: toId(p.userId),
              username: p.username,
              avatar: p.avatar,
              elo: p.elo,
            }))}
            spectators={spectators}
            currentUserId={myId}
            currentUsername={user?.username}
            roomId={roomId}
            gameStatus={gameStatus}
            gameStartedAt={
              typeof gameState?.metadata?.startedAt === 'number'
                ? (gameState?.metadata?.startedAt as number)
                : gameState?.status === 'playing'
                  ? Date.now() - (moveHistory.length * 200)
                  : null
            }
            onLeave={() => {
              if (roomId) leaveRoom(roomId);
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            onSurrender={handleSurrender}
            onPlayAgain={() => startMatchmaking(slug)}
            chatMessages={chatMessages}
            onSendChat={handleSendChat}
            latency={isGameConnected ? 42 : 999}
          />
        );
      case 'ludo':
        return (
          <LudoBoard
            board={board}
            disabled={disabled}
            isMyTurn={isMyTurn}
            onRoll={handleLudoRoll}
            onMoveToken={handleLudoToken}
            currentUserId={myId}
            turnPlayerId={gameState?.currentTurn ? toId(gameState.currentTurn) : undefined}
            playersMeta={players.map((p) => ({ userId: toId(p.userId), username: p.username }))}
            rollKey={gameState?.moveCount ?? moveHistory.length}
            turnPhase={
              gameStatus === 'waiting' || gameStatus === 'countdown'
                ? 'waiting'
                : isMyTurn
                  ? 'your-turn'
                  : 'opponent'
            }
          />
        );
      case 'quiz-battle':
        return (
          <QuizBattleBoard
            board={board}
            disabled={gameStatus !== 'playing'}
            onAnswer={handleQuizAnswer}
          />
        );
      default:
        return (
          <TicTacToeBoard
            board={board}
            onMove={handleTttMove}
            disabled={disabled}
            isMyTurn={gameStatus === 'playing' ? isMyTurn : undefined}
            myMark={myMark}
          />
        );
    }
  };

  const rewards = gameState?.rewards;
  const eloChange = rewards?.eloChange ?? 0;
  const gameTitle = formatGameTitle(slug);

  if (!isGameConnected || (isMatchmaking && !supportsBotFill && !currentRoom)) {
    return (
      <DashboardLayout>
        <div className="mb-4">
          <GamesBreadcrumb current={gameTitle} />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-primary-500" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-theme-primary font-display mb-2">
              {!isGameConnected
                ? 'Connecting...'
                : slug === 'snake-multiplayer'
                  ? 'Starting your arena...'
                  : 'Finding a match...'}
            </h2>
            <p className="text-theme-muted">
              {!isGameConnected
                ? 'Establishing game connection'
                : slug === 'snake-multiplayer'
                  ? 'Play now — other players can join mid-game'
                  : supportsBotFill
                    ? `Looking for a player. A bot joins in ${botEta}s.`
                    : `Looking for an opponent for ${gameTitle}`}
            </p>
          </div>
          {isGameConnected && supportsBotFill && (
            <Button variant="primary" onClick={requestBotFill}>
              Play vs Bot now
            </Button>
          )}
          {isGameConnected && (
            <Button variant="outline" onClick={cancelMatchmaking}>
              Cancel
            </Button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const actionsPanel = isLudo ? (
    <div className="ludo-glass rounded-2xl border border-theme p-4 space-y-2.5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-theme-muted font-semibold px-0.5">
        Match actions
      </p>
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Flag className="w-4 h-4" />}
          className="w-full ludo-action-danger border-0"
          onClick={handleSurrender}
          disabled={gameStatus !== 'playing'}
        >
          Surrender
        </Button>
      </motion.div>
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="w-full ludo-action-draw"
          disabled={gameStatus !== 'playing'}
          onClick={handleOfferDraw}
        >
          Offer Draw
        </Button>
      </motion.div>
      {drawOffered && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="primary" size="sm" className="w-full" onClick={handleAcceptDraw}>
            Accept Draw
          </Button>
        </motion.div>
      )}
    </div>
  ) : (
    <div
      className={cn(
        isTtt
          ? 'ttt-actions'
          : isChess
            ? 'chess-glass rounded-xl border border-theme'
            : 'game-panel',
        'p-3 sm:p-4 space-y-2',
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-theme-muted font-semibold px-0.5">
        Match actions
      </p>
      <div className={cn(isTtt ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Flag className="w-3.5 h-3.5" />}
          className={cn(
            'w-full text-theme-danger border-theme-danger/25 hover:bg-theme-danger/8 hover:border-theme-danger/40',
            !isTtt && 'col-span-full',
          )}
          onClick={handleSurrender}
          disabled={gameStatus !== 'playing'}
        >
          Surrender
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="w-full"
          disabled={gameStatus !== 'playing'}
          onClick={handleOfferDraw}
        >
          Offer Draw
        </Button>
      </div>
      {drawOffered && (
        <Button variant="primary" size="sm" className="w-full" onClick={handleAcceptDraw}>
          Accept Draw
        </Button>
      )}
    </div>
  );

  const chatPanel = isLudo ? (
    <GameChat
      messages={chatMessages}
      onSendMessage={handleSendChat}
      currentUserId={myId}
      currentUsername={user?.username}
    />
  ) : (
    <div
      className={cn(
        isChess ? 'chess-glass rounded-xl border border-theme' : isTtt ? 'ttt-actions' : 'game-panel',
        'p-4 flex flex-col h-72'
      )}
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-theme">
        <MessageSquare className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-semibold text-theme-primary tracking-tight">Game Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2.5 mb-3 min-h-0">
        {chatMessages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="font-semibold text-primary-500">{msg.user}: </span>
            <span className="text-theme-primary">{msg.text}</span>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <p className="text-xs text-theme-muted text-center py-6">No messages yet.</p>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          placeholder="Type a message..."
          className={cn('input-glass flex-1 px-3 py-2 text-xs', isTtt && 'ttt-chat-input')}
        />
        <button
          type="button"
          onClick={() => handleSendChat()}
          aria-label="Send message"
          className={cn(
            isTtt
              ? 'ttt-send-btn'
              : 'inline-flex items-center justify-center rounded-xl bg-primary-500 text-white px-3 py-2'
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (isSnake) {
    return <CoilRushApp variant="play" />;
  }

  return (
    <DashboardLayout>
      <div className={cn('space-y-5', isLudo && 'ludo-play-page')}>
        <AnimatePresence>
          {gameStatus === 'countdown' && countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'var(--overlay)' }}
            >
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-6xl sm:text-8xl font-display font-bold gradient-text"
              >
                {countdown || 'GO!'}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="mb-1.5">
              <GamesBreadcrumb current={gameTitle} />
            </div>
            <h1
              className={cn(
                'text-lg sm:text-xl font-bold text-theme-primary truncate tracking-tight',
                isLudo && 'font-display sm:text-2xl'
              )}
            >
              {gameTitle}
            </h1>
            <p className="text-sm text-theme-muted capitalize">
              {waitingForOpponent
                ? `Waiting for a player · bot in ${botEta}s`
                : gameStatus === 'playing'
                  ? hasBotOpponent
                    ? 'Match vs Bot'
                    : 'Match in progress'
                  : gameStatus}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isChess && <ChessStatus status={chessStatus} />}
            {isLudo && gameStatus === 'playing' && (
              <Badge variant="purple" className="gap-1.5">
                <Swords className="w-3 h-3" />
                {isMyTurn ? 'Your turn' : 'Live'}
              </Badge>
            )}
            <Badge variant="purple">{spectators.length} watching</Badge>
          </div>
        </div>

        {isChess ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <div className="space-y-2">
              <PlayerPanel
                username={me?.username || user?.username || 'You'}
                elo={me?.elo || user?.elo || 1000}
                timeLeft={myTime}
                isActive={isMyTurn}
                side="left"
              />
              <ChessCaptured
                board={gameState?.board}
                color={opponentColor}
                label="Captured"
              />
            </div>
            <div className="hidden md:flex items-center justify-center px-2">
              <div className="w-12 h-12 rounded-2xl chess-glass border border-theme flex items-center justify-center">
                <span className="text-xs font-bold text-theme-primary tracking-wider">VS</span>
              </div>
            </div>
            <div className="space-y-2">
              <PlayerPanel
                username={opponent?.username || 'Waiting...'}
                elo={opponent?.elo ?? '---'}
                timeLeft={opponentTime}
                isActive={gameStatus === 'playing' && !isMyTurn && !!opponent}
                side="right"
              />
              <ChessCaptured
                board={gameState?.board}
                color={myColor}
                label="Captured"
              />
            </div>
          </div>
        ) : isTtt ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <PlayerPanel
              username={me?.username || user?.username || 'You'}
              avatar={me?.avatar || user?.avatar}
              elo={me?.elo || user?.elo || 1000}
              timeLeft={myTime}
              isActive={isMyTurn}
              side="left"
              premium
              showTurnBadge
              winStreak={user?.winStreak}
              className="ttt-actions border-white/60"
            />
            <div className="flex items-center justify-center px-2 py-1">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                className="relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white"
                style={{
                  background:
                    'linear-gradient(135deg, #a855f7 0%, #7c3aed 45%, #3b82f6 100%)',
                  boxShadow:
                    '0 12px 28px -8px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
                aria-label="Versus"
              >
                <span className="text-[10px] font-bold tracking-[0.22em]">VS</span>
                {(myMark || opponentMark) && (
                  <span className="text-[9px] font-display opacity-90">
                    {myMark || 'X'} · {opponentMark || 'O'}
                  </span>
                )}
              </motion.div>
            </div>
            <PlayerPanel
              username={opponent?.username || 'Waiting...'}
              avatar={opponent?.avatar}
              elo={opponent?.elo ?? '---'}
              timeLeft={waitingForOpponent ? botEta : opponentTime}
              isActive={gameStatus === 'playing' && !isMyTurn && !!opponent}
              side="right"
              premium
              waiting={waitingForOpponent}
              isBot={hasBotOpponent}
              botEta={waitingForOpponent ? botEta : undefined}
              maxSeconds={waitingForOpponent ? 60 : 300}
              className="ttt-actions border-white/60"
            />
          </div>
        ) : isLudo ? null : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <PlayerBar
              username={me?.username || user?.username || 'You'}
              elo={me?.elo || user?.elo || 1000}
              timeLeft={formatTime(gameState?.timeLeft?.[myId])}
              isActive={isMyTurn}
              align="left"
            />
            <div className="hidden md:flex items-center justify-center px-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
                <span className="text-xs font-bold text-theme-primary tracking-wider">VS</span>
              </div>
            </div>
            <PlayerBar
              username={opponent?.username || 'Waiting...'}
              elo={opponent?.elo ?? '---'}
              timeLeft={formatTime(gameState?.timeLeft?.[toId(opponent?.userId)])}
              isActive={gameStatus === 'playing' && !isMyTurn && !!opponent}
              align="right"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(240px,280px)] gap-4 sm:gap-5">
          {isChess ? (
            <ChessArena>{renderBoard()}</ChessArena>
          ) : isLudo ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="ludo-arena relative flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 overflow-x-hidden"
            >
              {waitingForOpponent && (
                <div className="w-full max-w-[420px] mb-4 rounded-2xl bg-white/90 border border-black/5 px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-semibold text-neutral-800">Waiting for a player</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    A bot joins automatically in <span className="font-mono font-semibold">{botEta}s</span>
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={requestBotFill}
                  >
                    Play vs Bot now
                  </Button>
                </div>
              )}
              {renderBoard()}
            </motion.div>
          ) : isTtt ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'ttt-scene relative flex items-center justify-center overflow-hidden',
                'min-h-[420px] sm:min-h-[520px] lg:min-h-[600px]',
                'px-4 py-8 sm:p-10 md:p-14',
                isMyTurn && gameStatus === 'playing' && 'ttt-scene-active',
              )}
            >
              <div className="ttt-orb ttt-orb-1" aria-hidden />
              <div className="ttt-orb ttt-orb-2" aria-hidden />
              <div className="ttt-orb ttt-orb-3" aria-hidden />
              <div className="ttt-particles" aria-hidden>
                <span className="ttt-particle" style={{ left: '12%', bottom: '-6px', animationDelay: '0s' }} />
                <span className="ttt-particle" style={{ left: '28%', bottom: '-6px', animationDelay: '2.4s' }} />
                <span className="ttt-particle" style={{ left: '46%', bottom: '-6px', animationDelay: '4.1s' }} />
                <span className="ttt-particle" style={{ left: '62%', bottom: '-6px', animationDelay: '6.8s' }} />
                <span className="ttt-particle" style={{ left: '78%', bottom: '-6px', animationDelay: '1.6s' }} />
                <span className="ttt-particle" style={{ left: '90%', bottom: '-6px', animationDelay: '9.2s' }} />
              </div>
              <div className="relative z-[1] w-full flex flex-col items-center justify-center gap-5">
                {waitingForOpponent && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ttt-wait-card w-full max-w-[360px] px-5 py-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-theme-primary">
                      <Bot className="w-4 h-4 text-primary-500" />
                      Waiting for a player
                    </div>
                    <p className="text-xs text-theme-muted mt-1.5">
                      {currentRoom
                        ? <>A bot joins automatically in <span className="font-mono font-semibold text-primary-500">{botEta}s</span></>
                        : 'Finding a match...'}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={requestBotFill}
                    >
                      Play vs Bot now
                    </Button>
                  </motion.div>
                )}
                {renderBoard()}
              </div>
            </motion.div>
          ) : (
            <div
              className={cn(
                'game-arena relative flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] p-3 sm:p-6 md:p-10 overflow-x-auto',
                slug === 'connect-four' && 'c4-arena'
              )}
            >
              {waitingForOpponent && (
                <div className="w-full max-w-[420px] mb-4 rounded-2xl bg-white/90 dark:bg-white/10 border border-black/5 dark:border-white/10 px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-semibold text-theme-primary">Waiting for a player</p>
                  <p className="text-xs text-theme-muted mt-1">
                    A bot joins automatically in <span className="font-mono font-semibold">{botEta}s</span>
                  </p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={requestBotFill}>
                    Play vs Bot now
                  </Button>
                </div>
              )}
              {renderBoard()}
            </div>
          )}

          <div className="space-y-4">
            {actionsPanel}

            {isChess && <MoveHistory moves={moveHistory} />}

            {isLudo ? (
              <SpectatorBar
                spectators={spectators.map((id) => ({
                  id,
                  username: `Viewer ${id.slice(-4)}`,
                }))}
              />
            ) : (
              <div className={cn(isChess ? 'chess-glass rounded-xl border border-theme' : isTtt ? 'ttt-actions' : 'game-panel', 'p-4')}>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-theme-muted" />
                  <span className="text-sm text-theme-muted">
                    {spectators.length} Spectator{spectators.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {chatPanel}
          </div>
        </div>

        <GameOverModal
          isOpen={gameStatus === 'finished'}
          winner={gameState?.winner || null}
          currentUser={user?.id || ''}
          username={user?.username}
          eloChange={eloChange}
          xpGained={rewards?.xp}
          coinsEarned={rewards?.coins}
          onPlayAgain={() => startMatchmaking(slug)}
          onClose={() => {}}
        />
      </div>
    </DashboardLayout>
  );
}
