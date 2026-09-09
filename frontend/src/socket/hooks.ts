'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@/store/socket.store';
import { useGameStore } from '@/store/game.store';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';
import { useUIStore } from '@/store/ui.store';
import { SOCKET_EVENTS } from '@/constants/socket';
import { GameState, Message, Notification, Move, RoomPlayer } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { toId } from '@/lib/id';
import { coilLive, isCoilBoard } from '@/games/coil-rush/net/liveBoard';
import { createActionId } from '@/games/sdk';

const DEFAULT_GAME_TIME_SECONDS = 300;

function buildInitialTimeLeft(players: RoomPlayer[]): Record<string, number> {
  return Object.fromEntries(
    players.map((player) => [toId(player.userId), DEFAULT_GAME_TIME_SECONDS])
  );
}

function createInitialGameState(): GameState {
  return {
    board: Array(9).fill(null),
    currentTurn: '',
    status: 'waiting',
    moveCount: 0,
    timeLeft: {},
  };
}

/** Deep-clone server board so React always receives a new immutable tree */
function cloneBoard(board: unknown): unknown {
  if (board == null) return board;
  try {
    return JSON.parse(JSON.stringify(board));
  } catch {
    return board;
  }
}

function serverMoveCount(gameState: Record<string, unknown> | undefined, fallback: number): number {
  if (!gameState) return fallback;
  if (typeof gameState.moveCount === 'number') return gameState.moveCount;
  if (Array.isArray(gameState.moveHistory)) return gameState.moveHistory.length;
  return fallback;
}

/** Replace local game state with authoritative server snapshot (no in-place mutation) */
function applyServerGameState(
  prev: GameState,
  serverState: Record<string, unknown>,
  extras: Partial<GameState> = {}
): GameState {
  const serverTurn = (serverState.currentPlayer || serverState.currentTurn) as string | undefined;
  const moveCount = serverMoveCount(
    serverState,
    typeof extras.moveCount === 'number' ? extras.moveCount : prev.moveCount || 0
  );

  return {
    ...createInitialGameState(),
    ...prev,
    ...serverState,
    ...extras,
    board: serverState.board !== undefined ? cloneBoard(serverState.board) : cloneBoard(prev.board),
    currentTurn: serverTurn ? toId(serverTurn) : extras.currentTurn || prev.currentTurn,
    status: (extras.status || (serverState.status as GameState['status']) || prev.status || 'playing') as GameState['status'],
    winner: serverState.winner
      ? toId(serverState.winner)
      : extras.winner !== undefined
        ? extras.winner
        : prev.winner,
    moveCount,
    timeLeft: extras.timeLeft || prev.timeLeft || {},
  };
}

function positionToBoardIndex(position: unknown): number | null {
  if (typeof position === 'number') return position;
  if (position && typeof position === 'object' && 'row' in position && 'col' in position) {
    const { row, col } = position as { row: number; col: number };
    return row * 3 + col;
  }
  return null;
}

function applyTicTacToeMove(
  board: unknown[],
  players: RoomPlayer[],
  playerId: string,
  position: unknown
): unknown[] | null {
  const index = positionToBoardIndex(position);
  if (index == null || index < 0 || index > 8) return null;

  const nextBoard = [...board];
  if (nextBoard[index] != null) return null;

  const normalizedPlayerId = toId(playerId);
  const playerIndex = players.findIndex((player) => toId(player.userId) === normalizedPlayerId);
  if (playerIndex < 0) return null;

  nextBoard[index] = playerIndex === 0 ? 'X' : 'O';
  return nextBoard;
}

function buildBoardFromMoves(
  gameSlug: string | undefined,
  players: RoomPlayer[],
  moves: Array<{ player?: unknown; data?: { position?: unknown } }>
): unknown[] | null {
  if (gameSlug !== 'tic-tac-toe') return null;

  let board: unknown[] = Array(9).fill(null);
  for (const move of moves) {
    const playerId = toId(move.player);
    const updated = applyTicTacToeMove(board, players, playerId, move.data?.position);
    if (updated) board = updated;
  }
  return board;
}

export function useSocket() {
  const { socket, isConnected, isGameConnected, connect, disconnect, emit, on, off } = useSocketStore();
  return { socket, isConnected, isGameConnected, connect, disconnect, emit, on, off };
}

export function useGameSocket() {
  const { gameEmit, gameOn, gameOff, isGameConnected } = useSocketStore();
  const { user } = useAuthStore();
  const {
    setGameState,
    setPlayers,
    addMove,
    setCountdown,
    setIsPlaying,
    setRoom,
    addSpectator,
    removeSpectator,
    setMatchmaking,
    playerReady,
    resetGame,
  } = useGameStore();

  useEffect(() => {
    if (!isGameConnected) return;

    const handleRoomCreated = (data: unknown) => {
      const { roomId, matchId, gameType } = data as { roomId: string; matchId: string; gameType: string };
      setMatchmaking(true);
      setRoom({
        id: roomId,
        name: `${gameType} Room`,
        gameId: matchId,
        gameName: gameType,
        gameSlug: gameType,
        host: user?.id || '',
        hostUsername: user?.username || '',
        players: [],
        maxPlayers: gameType === 'snake-multiplayer' ? 8 : 2,
        isPrivate: false,
        status: 'waiting',
        spectators: [],
        createdAt: new Date().toISOString(),
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activeGameRoom', roomId);
      }
      if (user) {
        setPlayers([{
          userId: toId(user.id),
          username: user.username,
          avatar: user.avatar,
          elo: user.elo,
          isReady: false,
        }]);
      }
    };

    const handleMatchFound = (data: unknown) => {
      const payload = data as {
        roomId: string;
        matchId: string;
        gameType: string;
        status?: string;
        players?: Array<{ userId: unknown; username: string; avatar?: string; elo: number; isReady?: boolean }>;
        moves?: unknown[];
        gameState?: Record<string, unknown>;
      };
      setMatchmaking(false);
      setRoom({
        id: payload.roomId,
        name: `${payload.gameType} Room`,
        gameId: payload.matchId,
        gameName: payload.gameType,
        gameSlug: payload.gameType,
        host: '',
        hostUsername: '',
        players: [],
        maxPlayers: payload.gameType === 'snake-multiplayer' ? 8 : 2,
        isPrivate: false,
        status: (payload.status as 'waiting' | 'playing' | 'finished') || 'waiting',
        spectators: [],
        createdAt: new Date().toISOString(),
      });

      if (payload.players?.length) {
        setPlayers(
          payload.players.map((player) => ({
            userId: toId(player.userId),
            username: player.username,
            avatar: player.avatar,
            elo: player.elo,
            isReady: player.isReady ?? false,
          }))
        );
      }

      const playersForBoard =
        payload.players?.map((player) => ({
          userId: toId(player.userId),
          username: player.username,
          avatar: player.avatar,
          elo: player.elo,
          isReady: player.isReady ?? false,
        })) || useGameStore.getState().players;

      const moveCount = payload.moves?.length || 0;
      const replayedBoard = buildBoardFromMoves(
        payload.gameType,
        playersForBoard,
        (payload.moves as Array<{ player?: unknown; data?: { position?: unknown } }>) || []
      );

      const gameStatus =
        payload.status === 'playing' ? 'playing' : payload.status === 'finished' ? 'finished' : 'waiting';
      const currentTurn =
        (payload.gameState?.currentTurn as string | undefined) ||
        (playersForBoard.length >= 2 ? playersForBoard[moveCount % 2]?.userId : '') ||
        '';

      const serverTimeLeft = payload.gameState?.timeLeft as Record<string, number> | undefined;
      const timeLeft =
        serverTimeLeft && Object.keys(serverTimeLeft).length > 0
          ? serverTimeLeft
          : gameStatus === 'playing'
            ? buildInitialTimeLeft(playersForBoard)
            : {};

      const serverBoard = payload.gameState?.board;
      const authoritativeMoveCount = serverMoveCount(payload.gameState, moveCount);
      if (isCoilBoard(serverBoard)) coilLive.set(serverBoard);
      setGameState({
        ...createInitialGameState(),
        status: gameStatus,
        ...(payload.gameState || {}),
        board: cloneBoard(serverBoard ?? replayedBoard ?? createInitialGameState().board),
        moveCount: authoritativeMoveCount,
        currentTurn: currentTurn ? toId(currentTurn) : '',
        timeLeft,
      });
      setIsPlaying(gameStatus === 'playing');

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activeGameRoom', payload.roomId);
      }
    };

    const handleReconnected = (data: unknown) => {
      handleMatchFound(data);
    };

    const handlePlayerJoined = (player: unknown) => {
      const p = player as { userId: unknown; username: string; avatar?: string; elo: number; reconnected?: boolean };
      const userId = toId(p.userId);
      const existing = useGameStore.getState().players;
      if (existing.some((e) => e.userId === userId)) return;
      setPlayers([
        ...existing,
        {
          userId,
          username: p.username,
          avatar: p.avatar,
          elo: p.elo,
          isReady: p.reconnected ?? false,
        },
      ]);
      setMatchmaking(false);
      const myId = toId(useAuthStore.getState().user?.id);
      if (!p.reconnected && userId !== myId && typeof window !== 'undefined') {
        import('react-hot-toast').then(({ default: toast }) => {
          toast(`${p.username} joined the match`);
        });
      }
    };

    const handlePlayerLeft = (data: unknown) => {
      const { userId, temporary } = data as { userId: unknown; temporary?: boolean };
      if (temporary) return;
      setPlayers(useGameStore.getState().players.filter((p) => p.userId !== toId(userId)));
    };

    const handleMoveMade = (move: unknown) => {
      const m = move as {
        playerId: unknown;
        data: Record<string, unknown>;
        gameState?: Record<string, unknown>;
        timestamp: Date | string;
      };
      const playerId = m.playerId ? toId(m.playerId) : '';
      const action = (move as { action?: string }).action;
      if (playerId && action !== 'direction' && action !== 'tick' && action !== 'playerJoined') {
        addMove({
          id: `${Date.now()}-${playerId}-${Math.random().toString(36).slice(2, 7)}`,
          playerId,
          position: (m.data?.position ?? m.data) as string | number | number[],
          timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString(),
        });
      }

      const { gameState, players } = useGameStore.getState();
      const prev = gameState || createInitialGameState();

      if (m.gameState) {
        const incomingBoard = m.gameState.board;
        if (action === 'tick' && isCoilBoard(incomingBoard)) {
          coilLive.set(incomingBoard);
          if (prev.status !== 'playing') {
            setGameState({
              ...prev,
              status: 'playing',
              board: incomingBoard,
            });
            setIsPlaying(true);
          }
          return;
        }

        const incomingCount = serverMoveCount(
          m.gameState,
          (prev.moveCount || 0) + (playerId ? 1 : 0)
        );
        // Drop stale snapshots so older packets cannot overwrite newer board state
        if ((prev.moveCount || 0) > incomingCount) {
          return;
        }

        if (isCoilBoard(incomingBoard)) coilLive.set(incomingBoard);

        setGameState(
          applyServerGameState(prev, m.gameState, {
            moveCount: incomingCount,
            status: (m.gameState.status as GameState['status']) || 'playing',
            timeLeft: prev.timeLeft,
          })
        );
        setIsPlaying(true);
        return;
      }

      // Fallback client apply for tic-tac-toe when server state missing
      const position = m.data?.position ?? m.data;
      const currentBoard = (prev.board as unknown[]) || Array(9).fill(null);
      const updatedBoard = applyTicTacToeMove(currentBoard, players, playerId, position);
      if (!updatedBoard) return;

      const newMoveCount = (prev.moveCount || 0) + 1;
      const nextTurnPlayer =
        players.length >= 2 ? toId(players[newMoveCount % 2]?.userId) : playerId;

      setGameState({
        ...prev,
        board: updatedBoard,
        status: prev.status === 'waiting' ? 'playing' : prev.status || 'playing',
        currentTurn: nextTurnPlayer,
        moveCount: newMoveCount,
      });
      setIsPlaying(true);
    };

    const handleCountdown = (data: unknown) => {
      const { count } = data as { count: number };
      setCountdown(count);
      const prev = useGameStore.getState().gameState || createInitialGameState();
      setGameState({
        ...prev,
        status: 'countdown',
      });
    };

    const handleGameStart = (data: unknown) => {
      setIsPlaying(true);
      setMatchmaking(false);
      setCountdown(null);
      const payload = (data || {}) as { gameState?: Record<string, unknown>; players?: string[] };
      const { players } = useGameStore.getState();
      const serverState = payload.gameState || {};
      if (isCoilBoard(serverState.board)) coilLive.set(serverState.board);
      const currentTurn = toId(
        (serverState.currentPlayer as string) ||
          (serverState.currentTurn as string) ||
          players[0]?.userId ||
          user?.id ||
          ''
      );

      setGameState(
        applyServerGameState(createInitialGameState(), serverState, {
          status: 'playing',
          currentTurn,
          timeLeft: buildInitialTimeLeft(players),
          moveCount: serverMoveCount(serverState, 0),
        })
      );
    };

    const handleGameOver = (data: unknown) => {
      const { winner, reason, rewards, gameState } = data as {
        winner: unknown;
        reason: string;
        rewards?: Array<{
          userId: string;
          result: string;
          coins: number;
          xp: number;
          eloChange: number;
          balance: number;
        }>;
        gameState?: Record<string, unknown>;
      };
      const prev = useGameStore.getState().gameState || createInitialGameState();
      const myId = toId(useAuthStore.getState().user?.id);
      const myReward = rewards?.find((r) => toId(r.userId) === myId);

      setGameState({
        ...applyServerGameState(prev, gameState || {}, {
          status: 'finished',
          winner: winner ? toId(winner) : undefined,
          timeLeft: prev.timeLeft,
        }),
        rewards: myReward
          ? {
              coins: myReward.coins,
              xp: myReward.xp,
              eloChange: myReward.eloChange,
              balance: myReward.balance,
            }
          : undefined,
      } as GameState);
      setIsPlaying(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeGameRoom');
      }
      void reason;
    };

    const handleSpectatorJoin = (data: unknown) => {
      const { userId } = data as { userId: unknown };
      addSpectator(toId(userId));
    };

    const handleDrawOffered = (data: unknown) => {
      const { offeredBy, username } = data as { offeredBy: unknown; username: string };
      if (toId(offeredBy) === toId(useAuthStore.getState().user?.id)) return;
      useGameStore.setState((state) => ({
        gameState: state.gameState
          ? { ...state.gameState, metadata: { ...(state.gameState.metadata || {}), drawOffered: true, offeredBy: toId(offeredBy) } }
          : state.gameState,
      }));
      if (typeof window !== 'undefined') {
        import('react-hot-toast').then(({ default: toast }) => {
          toast(`${username} offered a draw`, { icon: '🤝' });
        });
      }
    };

    const handleError = (data: unknown) => {
      const payload = data as { message?: string; code?: string };
      if (payload?.code !== 'DUPLICATE_ACTION') {
        console.error('Game socket error:', payload?.code || payload?.message || data);
      }
      if (payload?.code !== 'INVALID_ACTION' && payload?.code !== 'DUPLICATE_ACTION') {
        setMatchmaking(false);
      }
    };

    gameOn(SOCKET_EVENTS.GAME.ROOM_CREATED, handleRoomCreated);
    gameOn(SOCKET_EVENTS.GAME.MATCH_FOUND, handleMatchFound);
    gameOn(SOCKET_EVENTS.GAME.RECONNECTED, handleReconnected);
    gameOn(SOCKET_EVENTS.GAME.PLAYER_JOINED, handlePlayerJoined);
    gameOn(SOCKET_EVENTS.GAME.PLAYER_LEFT, handlePlayerLeft);
    gameOn(SOCKET_EVENTS.GAME.MOVE_MADE, handleMoveMade);
    gameOn(SOCKET_EVENTS.GAME.COUNTDOWN, handleCountdown);
    gameOn(SOCKET_EVENTS.GAME.GAME_START, handleGameStart);
    gameOn(SOCKET_EVENTS.GAME.GAME_OVER, handleGameOver);
    gameOn(SOCKET_EVENTS.GAME.SPECTATOR_JOINED, handleSpectatorJoin);
    gameOn(SOCKET_EVENTS.GAME.DRAW_OFFERED, handleDrawOffered);
    gameOn(SOCKET_EVENTS.GAME.ERROR, handleError);
    gameOn(SOCKET_EVENTS.GAME.FINISHED, handleGameOver);
    gameOn(SOCKET_EVENTS.GAME.STARTED, handleGameStart);
    gameOn('error', handleError);

    return () => {
      gameOff(SOCKET_EVENTS.GAME.ROOM_CREATED, handleRoomCreated);
      gameOff(SOCKET_EVENTS.GAME.MATCH_FOUND, handleMatchFound);
      gameOff(SOCKET_EVENTS.GAME.RECONNECTED, handleReconnected);
      gameOff(SOCKET_EVENTS.GAME.PLAYER_JOINED, handlePlayerJoined);
      gameOff(SOCKET_EVENTS.GAME.PLAYER_LEFT, handlePlayerLeft);
      gameOff(SOCKET_EVENTS.GAME.MOVE_MADE, handleMoveMade);
      gameOff(SOCKET_EVENTS.GAME.COUNTDOWN, handleCountdown);
      gameOff(SOCKET_EVENTS.GAME.GAME_START, handleGameStart);
      gameOff(SOCKET_EVENTS.GAME.GAME_OVER, handleGameOver);
      gameOff(SOCKET_EVENTS.GAME.SPECTATOR_JOINED, handleSpectatorJoin);
      gameOff(SOCKET_EVENTS.GAME.DRAW_OFFERED, handleDrawOffered);
      gameOff(SOCKET_EVENTS.GAME.ERROR, handleError);
      gameOff(SOCKET_EVENTS.GAME.FINISHED, handleGameOver);
      gameOff(SOCKET_EVENTS.GAME.STARTED, handleGameStart);
      gameOff('error', handleError);
    };
  }, [
    isGameConnected,
    gameOn,
    gameOff,
    user,
    setGameState,
    setPlayers,
    addMove,
    setCountdown,
    setIsPlaying,
    setRoom,
    addSpectator,
    setMatchmaking,
  ]);

  const joinRoom = useCallback(
    (roomId: string) => gameEmit(SOCKET_EVENTS.GAME.JOIN_ROOM, { roomId }),
    [gameEmit]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      gameEmit(SOCKET_EVENTS.GAME.LEAVE_ROOM, { roomId });
      resetGame();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeGameRoom');
      }
    },
    [gameEmit, resetGame]
  );

  const makeMove = useCallback(
    (move: { roomId: string; action?: string; moveData: Record<string, unknown> }) =>
      gameEmit(SOCKET_EVENTS.GAME.MAKE_MOVE, {
        gameId: useGameStore.getState().currentRoom?.gameSlug,
        matchId: useGameStore.getState().currentRoom?.gameId,
        roomId: move.roomId,
        action: move.action || 'move',
        type: move.action || 'move',
        payload: move.moveData,
        moveData: move.moveData,
        actionId: createActionId(),
        timestamp: Date.now(),
      }),
    [gameEmit]
  );

  const offerDraw = useCallback(
    (roomId: string) => gameEmit(SOCKET_EVENTS.GAME.OFFER_DRAW, { roomId }),
    [gameEmit]
  );

  const acceptDraw = useCallback(
    (roomId: string) => gameEmit(SOCKET_EVENTS.GAME.ACCEPT_DRAW, { roomId }),
    [gameEmit]
  );

  const inviteFriend = useCallback(
    (friendId: string, roomId: string, gameType: string) =>
      gameEmit('game:inviteFriend', { friendId, roomId, gameType }),
    [gameEmit]
  );

  const ready = useCallback(
    (roomId: string) => {
      playerReady(useAuthStore.getState().user?.id || '');
      gameEmit(SOCKET_EVENTS.GAME.READY, { roomId });
    },
    [gameEmit, playerReady]
  );

  const surrender = useCallback(
    (roomId: string) => gameEmit(SOCKET_EVENTS.GAME.SURRENDER, { roomId }),
    [gameEmit]
  );

  const startMatchmaking = useCallback(
    (gameSlug: string, settings?: Record<string, unknown>) => {
      resetGame();
      setMatchmaking(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeGameRoom');
      }
      gameEmit(SOCKET_EVENTS.GAME.MATCHMAKING, { gameSlug, settings });
    },
    [gameEmit, resetGame, setMatchmaking]
  );

  const cancelMatchmaking = useCallback(
    () => {
      const roomId = useGameStore.getState().currentRoom?.id;
      gameEmit(SOCKET_EVENTS.GAME.CANCEL_MATCHMAKING, roomId ? { roomId } : undefined);
      resetGame();
    },
    [gameEmit, resetGame]
  );

  const fillBot = useCallback(
    (roomId?: string) => {
      const resolved =
        roomId ||
        useGameStore.getState().currentRoom?.id ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('activeGameRoom') : null) ||
        undefined;
      if (resolved) {
        gameEmit(SOCKET_EVENTS.GAME.JOIN_ROOM, { roomId: resolved });
      }
      gameEmit(SOCKET_EVENTS.GAME.FILL_BOT, resolved ? { roomId: resolved } : {});
    },
    [gameEmit]
  );

  return {
    joinRoom,
    leaveRoom,
    makeMove,
    ready,
    surrender,
    offerDraw,
    acceptDraw,
    inviteFriend,
    startMatchmaking,
    cancelMatchmaking,
    fillBot,
    isGameConnected,
  };
}

export function useGameTimer() {
  const gameState = useGameStore((s) => s.gameState);
  const players = useGameStore((s) => s.players);

  useEffect(() => {
    if (gameState?.status !== 'playing' || players.length < 2) return;
    if (Object.keys(gameState.timeLeft || {}).length > 0) return;

    // Patch only timeLeft using latest store state to avoid clobbering board updates
    useGameStore.setState((s) => {
      if (!s.gameState || s.gameState.status !== 'playing') return s;
      if (Object.keys(s.gameState.timeLeft || {}).length > 0) return s;
      return {
        gameState: {
          ...s.gameState,
          timeLeft: buildInitialTimeLeft(s.players),
        },
      };
    });
  }, [gameState?.status, gameState?.timeLeft, players.length]);

  useEffect(() => {
    if (gameState?.status !== 'playing' || !gameState.currentTurn) return;

    const interval = setInterval(() => {
      // Functional update: always derive from latest state so a tick never
      // overwrites a newer board/token snapshot from MOVE_MADE
      useGameStore.setState((s) => {
        const state = s.gameState;
        if (!state || state.status !== 'playing' || !state.currentTurn) return s;

        const activeId = toId(state.currentTurn);
        const current = state.timeLeft?.[activeId];
        if (current == null || current <= 0) return s;

        return {
          gameState: {
            ...state,
            timeLeft: {
              ...state.timeLeft,
              [activeId]: current - 1,
            },
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.status, gameState?.currentTurn]);
}

export function useChatSocket() {
  const { chatEmit, chatOn, chatOff, isConnected } = useSocketStore();
  const { addMessage, setTypingUser, updateLastMessage } = useChatStore();

  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message: unknown) => {
      const msg = message as Message & { room?: string };
      const conversationId = msg.conversationId || msg.room || '';
      addMessage(conversationId, { ...msg, conversationId });
      updateLastMessage(conversationId, { ...msg, conversationId });
    };

    const handleTyping = (data: unknown) => {
      const { room, userId, isTyping } = data as { room?: string; userId: string; isTyping?: boolean };
      if (room) setTypingUser(room, userId, isTyping ?? true);
    };

    chatOn(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleNewMessage);
    chatOn(SOCKET_EVENTS.CHAT.USER_TYPING, handleTyping);

    return () => {
      chatOff(SOCKET_EVENTS.CHAT.NEW_MESSAGE, handleNewMessage);
      chatOff(SOCKET_EVENTS.CHAT.USER_TYPING, handleTyping);
    };
  }, [isConnected, chatOn, chatOff, addMessage, setTypingUser, updateLastMessage]);

  const sendMessage = useCallback(
    (roomId: string, content: string) =>
      chatEmit(SOCKET_EVENTS.CHAT.SEND_MESSAGE, { room: roomId, content }),
    [chatEmit]
  );

  const startTyping = useCallback(
    (roomId: string) => chatEmit(SOCKET_EVENTS.CHAT.TYPING, { room: roomId }),
    [chatEmit]
  );

  const stopTyping = useCallback(
    (roomId: string) => chatEmit(SOCKET_EVENTS.CHAT.STOP_TYPING, { room: roomId }),
    [chatEmit]
  );

  const joinChatRoom = useCallback(
    (roomId: string) => chatEmit(SOCKET_EVENTS.CHAT.JOIN_ROOM, roomId),
    [chatEmit]
  );

  const leaveChatRoom = useCallback(
    (roomId: string) => chatEmit(SOCKET_EVENTS.CHAT.LEAVE_ROOM, roomId),
    [chatEmit]
  );

  return { sendMessage, startTyping, stopTyping, joinChatRoom, leaveChatRoom };
}

export function useNotificationSocket() {
  const { notificationOn, notificationOff, notificationEmit, notificationSocket } = useSocketStore();
  const { addNotification, setUnreadCount } = useNotificationStore();
  const setMaintenanceMode = useUIStore((state) => state.setMaintenanceMode);

  useEffect(() => {
    const handleNotification = (notification: unknown) => {
      addNotification(notification as Notification);
    };

    const handleUnreadCount = (payload: unknown) => {
      const count = (payload as { count?: number } | undefined)?.count;
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    };

    const handlePlatformStatus = (payload: unknown) => {
      const maintenanceMode = (payload as { maintenanceMode?: boolean } | undefined)?.maintenanceMode;
      if (typeof maintenanceMode === 'boolean') {
        setMaintenanceMode(maintenanceMode);
      }
    };

    notificationOn(SOCKET_EVENTS.NOTIFICATION.NEW, handleNotification);
    notificationOn(SOCKET_EVENTS.NOTIFICATION.UNREAD_COUNT, handleUnreadCount);
    notificationOn(SOCKET_EVENTS.PLATFORM.STATUS, handlePlatformStatus);
    notificationEmit(SOCKET_EVENTS.NOTIFICATION.SUBSCRIBE);
    notificationEmit(SOCKET_EVENTS.PLATFORM.SUBSCRIBE);

    return () => {
      notificationOff(SOCKET_EVENTS.NOTIFICATION.NEW, handleNotification);
      notificationOff(SOCKET_EVENTS.NOTIFICATION.UNREAD_COUNT, handleUnreadCount);
      notificationOff(SOCKET_EVENTS.PLATFORM.STATUS, handlePlatformStatus);
    };
  }, [
    notificationOn,
    notificationOff,
    notificationEmit,
    addNotification,
    setUnreadCount,
    setMaintenanceMode,
  ]);

  useEffect(() => {
    if (!notificationSocket) return;

    const resubscribe = () => {
      notificationEmit(SOCKET_EVENTS.NOTIFICATION.SUBSCRIBE);
      notificationEmit(SOCKET_EVENTS.PLATFORM.SUBSCRIBE);
    };

    notificationSocket.on('connect', resubscribe);
    return () => {
      notificationSocket.off('connect', resubscribe);
    };
  }, [notificationSocket, notificationEmit]);
}

export function usePresence() {
  const { onlineUsers } = useSocketStore();

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  return { onlineUsers, isUserOnline };
}
