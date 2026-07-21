'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@/store/socket.store';
import { useGameStore } from '@/store/game.store';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';
import { SOCKET_EVENTS } from '@/constants/socket';
import { GameState, Message, Notification, Move, RoomPlayer } from '@/types';
import { useAuthStore } from '@/store/auth.store';

function toId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
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

  const playerIndex = players.findIndex((player) => player.userId === playerId);
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
        maxPlayers: 2,
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
          userId: user.id,
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
        maxPlayers: 2,
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

      const replayedBoard = buildBoardFromMoves(
        payload.gameType,
        playersForBoard,
        (payload.moves as Array<{ player?: unknown; data?: { position?: unknown } }>) || []
      );

      const gameStatus =
        payload.status === 'playing' ? 'playing' : payload.status === 'finished' ? 'finished' : 'waiting';
      setGameState({
        ...createInitialGameState(),
        status: gameStatus,
        ...(payload.gameState || {}),
        ...(replayedBoard ? { board: replayedBoard, moveCount: payload.moves?.length || 0 } : {}),
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
    };

    const handlePlayerLeft = (data: unknown) => {
      const { userId } = data as { userId: unknown };
      setPlayers(useGameStore.getState().players.filter((p) => p.userId !== toId(userId)));
    };

    const handleMoveMade = (move: unknown) => {
      const m = move as { playerId: unknown; data: { position?: unknown }; timestamp: Date | string };
      const playerId = toId(m.playerId);
      addMove({
        id: `${Date.now()}`,
        playerId,
        position: m.data?.position as string | number | number[],
        timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString(),
      });

      const { gameState, players } = useGameStore.getState();
      const currentBoard = (gameState?.board as unknown[]) || Array(9).fill(null);
      const updatedBoard = applyTicTacToeMove(
        currentBoard,
        players,
        playerId,
        m.data?.position
      );

      if (!updatedBoard) return;

      const nextPlayerIndex = players.findIndex((player) => player.userId === playerId);
      const nextTurnPlayer =
        players.length >= 2 ? players[(nextPlayerIndex + 1) % players.length]?.userId : playerId;

      setGameState({
        ...(gameState || createInitialGameState()),
        board: updatedBoard,
        status: gameState?.status === 'waiting' ? 'playing' : (gameState?.status || 'playing'),
        currentTurn: nextTurnPlayer || playerId,
        moveCount: (gameState?.moveCount || 0) + 1,
      });
      setIsPlaying(true);
    };

    const handleCountdown = (data: unknown) => {
      const { count } = data as { count: number };
      setCountdown(count);
      setGameState({
        ...createInitialGameState(),
        status: 'countdown',
      });
    };

    const handleGameStart = () => {
      setIsPlaying(true);
      setCountdown(null);
      setGameState({
        ...createInitialGameState(),
        status: 'playing',
        currentTurn: useGameStore.getState().players[0]?.userId || user?.id || '',
      });
    };

    const handleGameOver = (data: unknown) => {
      const { winner, reason } = data as { winner: unknown; reason: string };
      setGameState({
        ...(useGameStore.getState().gameState || createInitialGameState()),
        status: 'finished',
        winner: winner ? toId(winner) : undefined,
      });
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

    const handleError = (data: unknown) => {
      console.error('Game socket error:', data);
      setMatchmaking(false);
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
    (move: { position: unknown; roomId: string }) =>
      gameEmit(SOCKET_EVENTS.GAME.MAKE_MOVE, {
        roomId: move.roomId,
        action: 'place',
        moveData: { position: move.position },
      }),
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
    (gameSlug: string) => {
      resetGame();
      setMatchmaking(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeGameRoom');
      }
      gameEmit(SOCKET_EVENTS.GAME.MATCHMAKING, { gameSlug });
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

  return { joinRoom, leaveRoom, makeMove, ready, surrender, startMatchmaking, cancelMatchmaking, isGameConnected };
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

  return { sendMessage, startTyping, stopTyping, joinChatRoom };
}

export function useNotificationSocket() {
  const { notificationOn, notificationOff } = useSocketStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const handleNotification = (notification: unknown) => {
      addNotification(notification as Notification);
    };

    notificationOn(SOCKET_EVENTS.NOTIFICATION.NEW, handleNotification);

    return () => {
      notificationOff(SOCKET_EVENTS.NOTIFICATION.NEW, handleNotification);
    };
  }, [notificationOn, notificationOff, addNotification]);
}

export function usePresence() {
  const { onlineUsers } = useSocketStore();

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  return { onlineUsers, isUserOnline };
}
