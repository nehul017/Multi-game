'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Handshake, MessageSquare, History } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useSocketStore } from '@/store/socket.store';
import { useChatSocket, useGameSocket, useGameTimer } from '@/socket/hooks';
import { useGameClient, useGameSession } from '@/games/sdk';
import { SOCKET_EVENTS } from '@/constants/socket';
import { toId } from '@/lib/id';
import toast from 'react-hot-toast';
import { CHESS_BRAND } from '../brand';
import { chessAudio } from '../audio/chessAudio';
import { ChessRules } from '../engine/chessRules';
import { pickAiMove } from '../engine/chessAI';
import { gridToFen, serverBoardToGrid, startingGrid } from '../engine/convert';
import { chessSettings } from '../storage/settings';
import { createChessNetwork } from '../net/session';
import { ChessBoard } from '../components/ChessBoard';
import { ChessPlayerCard } from '../components/ChessPlayerCard';
import { ChessMoveHistory } from '../components/ChessMoveHistory';
import { ChessGameHeader } from '../components/ChessGameHeader';
import { ChessPromotionDialog } from '../components/ChessPromotionDialog';
import { ChessResultDialog } from '../components/ChessResultDialog';
import { ChessSettingsPanel } from '../components/ChessSettingsPanel';
import { ChessMatchIntro } from '../components/ChessMatchIntro';
import type {
  ChessColor,
  ChessDifficulty,
  ChessGrid,
  ChessMoveInput,
  ChessPieceType,
  ChessPlayerInfo,
  ChessPlayMode,
  ChessPos,
  ChessResultStats,
  ChessSanMove,
  ChessSettings,
  ConnectionStatus,
} from '../types';

interface ChessMatchViewProps {
  mode: ChessPlayMode;
  timeSeconds: number;
  difficulty: ChessDifficulty;
  room?: string;
  onAnalyze: (pgn: string) => void;
}

function playCueFromMove(move: ChessSanMove | null, ended?: 'checkmate' | 'draw' | null) {
  if (ended === 'checkmate') chessAudio.play('checkmate');
  else if (ended === 'draw') chessAudio.play('draw');
  else if (move?.castle) chessAudio.play('castle');
  else if (move?.check) chessAudio.play('check');
  else if (move?.captured) chessAudio.play('capture');
  else chessAudio.play('move');
}

export function ChessMatchView({ mode, timeSeconds, difficulty, room, onAnalyze }: ChessMatchViewProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { gameState, players, countdown, isMatchmaking, currentRoom, moveHistory } = useGameStore();
  const {
    joinRoom,
    makeMove,
    surrender,
    offerDraw,
    acceptDraw,
    startMatchmaking,
    cancelMatchmaking,
    isGameConnected,
  } = useGameSocket();
  useGameClient('chess', room);
  const { start: startSolo, complete: completeSolo } = useGameSession('chess');
  const { sendMessage, joinChatRoom, leaveChatRoom } = useChatSocket();
  const { chatOn, chatOff, chatSocket } = useSocketStore();
  useGameTimer();

  const [vsBot, setVsBot] = useState(mode === 'computer');
  const online = !vsBot && (mode === 'quick' || mode === 'ranked' || mode === 'casual' || mode === 'private');
  const playMode: ChessPlayMode = vsBot ? 'computer' : mode;
  const [settings, setSettings] = useState<ChessSettings>(chessSettings.get());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [flipOverride, setFlipOverride] = useState<ChessColor | null>(null);
  const [flipKey, setFlipKey] = useState(0);
  const [intro, setIntro] = useState<{ phase: 'vs' | 'count'; count: number | string } | null>(null);
  const [botEta, setBotEta] = useState(60);
  const [promotion, setPromotion] = useState<{ from: ChessPos; to: ChessPos } | null>(null);
  const [result, setResult] = useState<ChessResultStats | null>(null);
  const [chat, setChat] = useState<Array<{ user: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [clock, setClock] = useState({ white: timeSeconds, black: timeSeconds });
  const [localBoard, setLocalBoard] = useState<ChessGrid>(startingGrid());
  const [localMoves, setLocalMoves] = useState<ChessSanMove[]>([]);
  const [localTurn, setLocalTurn] = useState<ChessColor>('white');
  const [localCheck, setLocalCheck] = useState(false);
  const [localMate, setLocalMate] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: ChessPos; to: ChessPos } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const rulesRef = useRef(new ChessRules());
  const startedAt = useRef(Date.now());
  const sessionStarted = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const myId = toId(user?.id);
  const net = useMemo(
    () =>
      createChessNetwork({
        startMatchmaking,
        joinRoom,
        makeMove,
        cancelMatchmaking,
        surrender,
        offerDraw,
        acceptDraw,
        slug: CHESS_BRAND.slug,
      }),
    [startMatchmaking, joinRoom, makeMove, cancelMatchmaking, surrender, offerDraw, acceptDraw]
  );

  const me = players.find((p) => toId(p.userId) === myId);
  const opponent = players.find((p) => toId(p.userId) !== myId);
  const colorMap = (gameState?.metadata?.colors || {}) as Record<string, ChessColor>;
  const myOnlineColor: ChessColor =
    colorMap[myId] || (players[0] && toId(players[0].userId) === myId ? 'white' : 'black');

  const myColor: ChessColor = online ? myOnlineColor : 'white';
  const orientation: ChessColor =
    flipOverride ||
    (settings.orientation === 'auto' ? myColor : settings.orientation === 'black' ? 'black' : 'white');

  const onlineBoard = serverBoardToGrid(gameState?.board) || startingGrid();
  const board = online ? onlineBoard : localBoard;
  const turn: ChessColor = online
    ? ((colorMap[toId(gameState?.currentTurn)] as ChessColor) || localTurn)
    : localTurn;
  const inCheck = online ? Boolean(gameState?.metadata?.inCheck) : localCheck;
  const isMate = online ? gameState?.status === 'finished' && Boolean(gameState?.metadata?.inCheck) : localMate;
  const isMyTurn = online
    ? gameState?.status === 'playing' && toId(gameState.currentTurn) === myId
    : playMode === 'local' || (playMode === 'computer' && turn === 'white');

  const playerInfo: ChessPlayerInfo = {
    id: myId || 'me',
    username: me?.username || user?.username || 'You',
    avatar: me?.avatar || user?.avatar,
    rating: Number(me?.elo || user?.elo || 1000),
    color: myColor,
  };
  const opponentInfo: ChessPlayerInfo = {
    id: opponent ? toId(opponent.userId) : 'opp',
    username:
      playMode === 'computer'
        ? botThinking
          ? `Computer · thinking`
          : `Computer · ${difficulty}`
        : playMode === 'local'
          ? 'Player 2'
          : opponent?.username || 'Waiting…',
    avatar: opponent?.avatar,
    rating: Number(opponent?.elo || 1200),
    color: myColor === 'white' ? 'black' : 'white',
    isBot: playMode === 'computer',
    isLocal: playMode === 'local',
  };

  const connection: ConnectionStatus = !online
    ? result
      ? 'finished'
      : 'offline'
    : !isGameConnected
      ? 'connecting'
      : gameState?.status === 'finished'
        ? 'finished'
        : currentRoom
          ? 'connected'
          : isMatchmaking
            ? 'connecting'
            : 'disconnected';

  useEffect(() => {
    if (online) return;
    let cancelled = false;
    setSessionError(null);
    setPlaying(true);
    startedAt.current = Date.now();
    chessAudio.unlock();
    chessAudio.play('start');
    void startSolo({ mode: playMode, difficulty, timeControl: timeSeconds }).catch((err: unknown) => {
      if (cancelled) return;
      const message = err instanceof Error ? err.message : 'Could not start game session';
      setSessionError(message);
      toast.error(message);
    });
    return () => {
      cancelled = true;
    };
  }, [online, playMode, difficulty, timeSeconds, startSolo]);

  useEffect(() => {
    if (!intro || intro.phase !== 'count') return;
    if (intro.count === 'GO') {
      const t = setTimeout(() => {
        setIntro(null);
        setPlaying(true);
        startedAt.current = Date.now();
        chessAudio.play('start');
      }, 400);
      return () => clearTimeout(t);
    }
    const n = Number(intro.count);
    const t = setTimeout(() => {
      setIntro({ phase: 'count', count: n <= 1 ? 'GO' : n - 1 });
    }, 600);
    return () => clearTimeout(t);
  }, [intro]);

  useEffect(() => {
    if (!online || currentRoom || result || gameState?.status === 'playing' || gameState?.status === 'countdown') {
      return;
    }
    setBotEta(60);
    const tick = window.setInterval(() => {
      setBotEta((left) => Math.max(0, left - 1));
    }, 1000);
    const start = window.setTimeout(() => startBotGame(), 60_000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, currentRoom, result, gameState?.status]);

  useEffect(() => {
    if (!online) return;
    const tryStart = () => {
      if (sessionStarted.current || !useSocketStore.getState().isGameConnected) return;
      sessionStarted.current = true;
      if (room) {
        joinRoom(room);
        return;
      }
      startMatchmaking(CHESS_BRAND.slug, {
        timeControl: timeSeconds,
        rated: mode === 'ranked',
        casual: mode === 'casual',
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
      if (roomId) useSocketStore.getState().gameEmit(SOCKET_EVENTS.GAME.LEAVE_ROOM, { roomId });
      else useSocketStore.getState().gameEmit(SOCKET_EVENTS.GAME.CANCEL_MATCHMAKING);
      useGameStore.getState().resetGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => {
    if (online && gameState?.status === 'countdown') {
      setIntro({ phase: 'count', count: countdown || 3 });
    }
    if (online && gameState?.status === 'playing' && intro) {
      setIntro(null);
      setPlaying(true);
      chessAudio.play('start');
    }
  }, [online, gameState?.status, countdown, intro]);

  useEffect(() => {
    if (online || !playing || result) return;
    const id = window.setInterval(() => {
      setClock((prev) => {
        const key = turn;
        const next = Math.max(0, prev[key] - 0.1);
        if (next <= 10 && prev[key] > 10) chessAudio.play('timer');
        if (next <= 0 && prev[key] > 0) {
          finishLocal(turn === myColor ? 'loss' : 'win', 'timeout');
        }
        return { ...prev, [key]: next };
      });
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, turn, result, myColor, online]);

  useEffect(() => {
    if (online || playMode !== 'computer' || !playing || result || turn !== 'black' || botThinking) return;
    const think = window.setTimeout(() => {
      setBotThinking(true);
      window.setTimeout(() => {
        try {
          const move = pickAiMove(rulesRef.current.fen(), difficulty);
          if (move) applyLocal(move);
        } catch {
          chessAudio.play('illegal');
        } finally {
          setBotThinking(false);
        }
      }, 20);
    }, 420);
    return () => window.clearTimeout(think);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, playMode, playing, result, turn, difficulty, localMoves.length, botThinking]);

  useEffect(() => {
    const roomId = currentRoom?.id;
    if (!roomId || !chatSocket?.connected) return;
    joinChatRoom(roomId);
    const onMsg = (raw: unknown) => {
      const msg = raw as { content?: string; sender?: { username?: string } };
      if (msg.content) setChat((prev) => [...prev, { user: msg.sender?.username || 'Player', text: msg.content! }]);
    };
    chatOn(SOCKET_EVENTS.CHAT.NEW_MESSAGE, onMsg);
    return () => {
      leaveChatRoom(roomId);
      chatOff(SOCKET_EVENTS.CHAT.NEW_MESSAGE, onMsg);
    };
  }, [currentRoom?.id, chatSocket?.connected, joinChatRoom, leaveChatRoom, chatOn, chatOff]);

  useEffect(() => {
    if (!online || gameState?.status !== 'finished' || result) return;
    const won = gameState.winner ? toId(gameState.winner) === myId : false;
    const draw = !gameState.winner;
    chessAudio.play(draw ? 'draw' : won ? 'victory' : 'defeat');
    setResult({
      outcome: draw ? 'draw' : won ? 'win' : 'loss',
      reason: gameState.metadata?.inCheck ? 'checkmate' : 'resign',
      moves: moveHistory.length,
      captures: moveHistory.filter((m) => String(m.notation || '').includes('x')).length,
      durationMs: Date.now() - startedAt.current,
      eloChange: gameState.rewards?.eloChange,
      xp: gameState.rewards?.xp,
      coins: gameState.rewards?.coins,
    });
  }, [online, gameState, myId, result, moveHistory]);

  const finishLocal = (outcome: ChessResultStats['outcome'], reason: ChessResultStats['reason']) => {
    if (result) return;
    chessAudio.play(outcome === 'win' ? 'victory' : outcome === 'loss' ? 'defeat' : 'draw');
    setPlaying(false);
    const stats: ChessResultStats = {
      outcome,
      reason,
      moves: rulesRef.current.history().length,
      captures: rulesRef.current.history().filter((m) => m.captured).length,
      durationMs: Date.now() - startedAt.current,
    };
    setResult(stats);
    void completeSolo({
      result: outcome,
      reason,
      moves: stats.moves,
      captures: stats.captures,
      durationMs: stats.durationMs,
      mode: playMode,
    })
      .then((saved) => {
        if (!saved?.rewards) return;
        setResult((prev) =>
          prev
            ? {
                ...prev,
                eloChange: saved.rewards?.eloChange,
                xp: saved.rewards?.xp,
                coins: saved.rewards?.coins,
              }
            : prev
        );
      })
      .catch(() => undefined);
  };

  const applyLocal = (move: ChessMoveInput) => {
    const applied = rulesRef.current.tryMove(move);
    if (!applied) {
      chessAudio.play('illegal');
      return false;
    }
    setLocalBoard(rulesRef.current.board());
    setLocalMoves(rulesRef.current.history());
    setLocalTurn(rulesRef.current.turn());
    setLocalCheck(rulesRef.current.inCheck());
    setLocalMate(rulesRef.current.isCheckmate());
    setLastMove({ from: move.from, to: move.to });
    if (rulesRef.current.isCheckmate()) {
      playCueFromMove(applied, 'checkmate');
      const winner = applied.color === myColor ? 'win' : 'loss';
      finishLocal(playMode === 'local' ? (applied.color === 'white' ? 'win' : 'loss') : winner, 'checkmate');
    } else if (rulesRef.current.isDraw()) {
      playCueFromMove(applied, 'draw');
      finishLocal('draw', rulesRef.current.isStalemate() ? 'stalemate' : 'draw');
    } else {
      playCueFromMove(applied);
    }
    return true;
  };

  const handleMove = (move: ChessMoveInput) => {
    chessAudio.unlock();
    if (!playing) return false;
    if (online) {
      if (!isMyTurn || !currentRoom?.id) return false;
      net.move(currentRoom.id, move);
      return true;
    }
    if (playMode === 'computer' && localTurn !== 'white') return false;
    return applyLocal(move);
  };

  const legalTargets = useCallback(
    (from: ChessPos) => {
      if (!online) return rulesRef.current.legalTargets(from);
      const grid = serverBoardToGrid(gameState?.board);
      if (!grid) return [];
      try {
        const live = new ChessRules();
        live.loadFen(gridToFen(grid, turn));
        return live.legalTargets(from);
      } catch {
        return [];
      }
    },
    [online, gameState?.board, turn]
  );

  const needsPromotion = (from: ChessPos, to: ChessPos) => {
    if (!online) return rulesRef.current.needsPromotion(from, to);
    const grid = serverBoardToGrid(gameState?.board);
    if (!grid) return false;
    try {
      const live = new ChessRules();
      live.loadFen(gridToFen(grid, turn));
      return live.needsPromotion(from, to);
    } catch {
      return false;
    }
  };

  const resetLocal = () => {
    rulesRef.current = new ChessRules();
    setLocalBoard(startingGrid());
    setLocalMoves([]);
    setLocalTurn('white');
    setLocalCheck(false);
    setLocalMate(false);
    setLastMove(null);
    setClock({ white: timeSeconds, black: timeSeconds });
    setResult(null);
    setBotThinking(false);
    setIntro(null);
    setPlaying(true);
    startedAt.current = Date.now();
    setSessionError(null);
    chessAudio.unlock();
    chessAudio.play('start');
    void startSolo({ mode: playMode, difficulty, timeControl: timeSeconds }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Could not start game session';
      setSessionError(message);
      toast.error(message);
    });
  };

  const startBotGame = () => {
    chessAudio.unlock();
    cancelMatchmaking();
    const roomId = useGameStore.getState().currentRoom?.id;
    if (roomId) useSocketStore.getState().gameEmit(SOCKET_EVENTS.GAME.LEAVE_ROOM, { roomId });
    useGameStore.getState().resetGame();
    sessionStarted.current = true;
    setVsBot(true);
    resetLocal();
  };

  const statusLabel = result
    ? result.outcome === 'win'
      ? 'Victory'
      : result.outcome === 'loss'
        ? 'Defeat'
        : 'Drawn'
    : !playing
      ? sessionError
        ? 'Session failed'
        : isMatchmaking
          ? 'Finding opponent'
          : 'Getting ready'
      : inCheck
        ? isMate
          ? 'Checkmate'
          : 'Check'
        : `${turn === 'white' ? 'White' : 'Black'} to move`;

  const onlineMoves: ChessSanMove[] = moveHistory.map((m, i) => ({
    san: m.notation || `${i + 1}`,
    from: 'a1',
    to: 'a1',
    color: i % 2 === 0 ? 'white' : 'black',
  }));

  const moves = online ? onlineMoves : localMoves;
  const pgn = online ? moves.map((m, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${m.san}` : m.san)).join(' ') : rulesRef.current.pgn();
  const myTime = online ? gameState?.timeLeft?.[myId] ?? clock[myColor] : clock[myColor];
  const oppTime = online ? gameState?.timeLeft?.[toId(opponent?.userId)] ?? clock[opponentInfo.color] : clock[opponentInfo.color];

  const toggleFullscreen = async () => {
    const node = rootRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      await node.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <div ref={rootRef} className="cx-match">
      <ChessGameHeader
        mode={playMode}
        statusLabel={statusLabel}
        connection={connection}
        muted={settings.muted}
        fullscreen={fullscreen}
        onBack={() => router.push(`/games/${CHESS_BRAND.slug}`)}
        onSettings={() => setSettingsOpen(true)}
        onMute={() => setSettings(chessSettings.set({ muted: !settings.muted }))}
        onFullscreen={toggleFullscreen}
        onFlip={() => {
          setFlipOverride((prev) => (prev === 'black' || (!prev && orientation === 'white') ? 'black' : 'white'));
          setFlipKey((k) => k + 1);
        }}
      />

      <div className="cx-match-grid">
        <div className="cx-board-col">
          <ChessPlayerCard
            player={orientation === myColor ? opponentInfo : playerInfo}
            board={board}
            seconds={orientation === myColor ? oppTime : myTime}
            active={playing && turn === (orientation === myColor ? opponentInfo.color : playerInfo.color)}
            showCaptured={settings.showCaptured}
            compact
          />
          <div className="cx-board-stage">
            <ChessBoard
              board={board}
              orientation={orientation}
              playerColor={playMode === 'local' ? 'both' : myColor}
              disabled={!playing || (!isMyTurn && mode !== 'local')}
              inCheck={inCheck}
              checkColor={inCheck ? turn : undefined}
              checkmate={isMate}
              lastMove={lastMove}
              settings={settings}
              onMove={handleMove}
              onIllegal={() => chessAudio.play('illegal')}
              legalTargets={legalTargets}
              needsPromotion={needsPromotion}
              onPromoteRequest={(from, to) => setPromotion({ from, to })}
              flipKey={flipKey}
            />
          </div>
          <ChessPlayerCard
            player={orientation === myColor ? playerInfo : opponentInfo}
            board={board}
            seconds={orientation === myColor ? myTime : oppTime}
            active={playing && turn === (orientation === myColor ? playerInfo.color : opponentInfo.color)}
            showCaptured={settings.showCaptured}
          />
        </div>

        <aside className="cx-side">
          <div className="cx-panel p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-theme-muted font-semibold">Actions</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-theme-danger border-theme-danger/25"
              leftIcon={<Flag className="w-3.5 h-3.5" />}
              disabled={!playing}
              onClick={() => {
                if (online && currentRoom?.id) net.resign(currentRoom.id);
                else finishLocal(playMode === 'local' ? 'draw' : 'loss', 'resign');
              }}
            >
              Resign
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              leftIcon={<Handshake className="w-3.5 h-3.5" />}
              disabled={!playing}
              onClick={() => {
                if (online && currentRoom?.id) net.offerDraw(currentRoom.id);
                else finishLocal('draw', 'agreement');
              }}
            >
              Offer draw
            </Button>
          </div>
          <div className="hidden lg:block">
            <ChessMoveHistory moves={moves} pgn={pgn} />
          </div>
          {online && (
            <div className="cx-panel hidden lg:flex flex-col h-56 p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold">Chat</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
                {chat.map((m, i) => (
                  <p key={i}><b className="text-primary-500">{m.user}:</b> {m.text}</p>
                ))}
              </div>
              <form
                className="flex gap-2 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim() || !currentRoom?.id) return;
                  sendMessage(currentRoom.id, chatInput.trim());
                  setChat((prev) => [...prev, { user: user?.username || 'You', text: chatInput.trim() }]);
                  setChatInput('');
                }}
              >
                <input className="input-glass flex-1 px-2 py-1.5 text-xs" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message" />
                <Button size="sm" type="submit">Send</Button>
              </form>
            </div>
          )}
        </aside>
      </div>

      <div className="cx-mobile-bar lg:hidden">
        <button type="button" onClick={() => setHistoryOpen(true)}><History className="w-4 h-4" /> Moves</button>
        {online && <button type="button" onClick={() => setChatOpen(true)}><MessageSquare className="w-4 h-4" /> Chat</button>}
      </div>

      {online && !playing && !result && (
        <div className="cx-intro">
          <div className="cx-intro-card">
            <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted font-semibold">
              {isMatchmaking || !isGameConnected ? 'Finding a player' : 'Waiting for opponent'}
            </p>
            <h2 className="font-display text-2xl font-bold text-theme-primary mt-2 mb-2">
              {!isGameConnected ? 'Connecting…' : 'Matchmaking'}
            </h2>
            <p className="text-sm text-theme-muted mb-2">
              Looking for a player. A bot joins automatically in{' '}
              <span className="font-mono font-semibold text-theme-primary">{botEta}s</span>.
            </p>
            <p className="text-xs text-theme-muted mb-5">Or start the bot match now.</p>
            <Button variant="primary" className="w-full" onClick={startBotGame}>
              Play vs Bot now
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => router.push(`/games/${CHESS_BRAND.slug}`)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {intro && (
          <ChessMatchIntro
            phase={intro.phase}
            count={intro.count}
            playerName={playerInfo.username}
            opponentName={opponentInfo.username}
            playerAvatar={playerInfo.avatar}
            opponentAvatar={opponentInfo.avatar}
          />
        )}
      </AnimatePresence>

      {promotion && (
        <ChessPromotionDialog
          color={turn}
          pieceStyle={settings.pieceStyle}
          onSelect={(type: ChessPieceType) => {
            handleMove({ ...promotion, promotion: type });
            chessAudio.play('promotion');
            setPromotion(null);
          }}
          onCancel={() => setPromotion(null)}
        />
      )}

      <ChessSettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={(next) => setSettings(chessSettings.set(next))}
        onClose={() => setSettingsOpen(false)}
      />

      {(historyOpen || chatOpen) && (
        <div className="cx-sheet" role="dialog">
          <button type="button" className="cx-sheet-close" onClick={() => { setHistoryOpen(false); setChatOpen(false); }}>Close</button>
          {historyOpen && <ChessMoveHistory moves={moves} pgn={pgn} />}
          {chatOpen && online && (
            <div className="cx-panel p-3 mt-3">
              {chat.map((m, i) => (
                <p key={i} className="text-xs"><b>{m.user}:</b> {m.text}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <ChessResultDialog
        open={Boolean(result)}
        stats={result}
        onAgain={() => {
          if (vsBot || playMode === 'computer' || playMode === 'local') {
            resetLocal();
            return;
          }
          setResult(null);
          sessionStarted.current = false;
          startMatchmaking(CHESS_BRAND.slug, { timeControl: timeSeconds, rated: mode === 'ranked' });
        }}
        onNewGame={() => router.push(`/games/${CHESS_BRAND.slug}`)}
        onAnalyze={() => onAnalyze(pgn)}
      />
    </div>
  );
}
