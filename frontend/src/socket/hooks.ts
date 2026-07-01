'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@/store/socket.store';
import { useGameStore } from '@/store/game.store';
import { useChatStore } from '@/store/chat.store';
import { useNotificationStore } from '@/store/notification.store';
import { GameState, Message, Notification, Move, RoomPlayer } from '@/types';

export function useSocket() {
  const { socket, isConnected, connect, disconnect, emit, on, off } = useSocketStore();
  return { socket, isConnected, connect, disconnect, emit, on, off };
}

export function useGameSocket() {
  const { emit, on, off } = useSocketStore();
  const {
    setGameState,
    setPlayers,
    addMove,
    setCountdown,
    setIsPlaying,
    setRoom,
    addSpectator,
    removeSpectator,
  } = useGameStore();

  useEffect(() => {
    const handleGameState = (state: unknown) => {
      setGameState(state as GameState);
    };

    const handlePlayerJoined = (player: unknown) => {
      setPlayers([...(useGameStore.getState().players), player as RoomPlayer]);
    };

    const handlePlayerLeft = (data: unknown) => {
      const { userId } = data as { userId: string };
      setPlayers(useGameStore.getState().players.filter((p) => p.userId !== userId));
    };

    const handleMoveMade = (move: unknown) => {
      addMove(move as Move);
    };

    const handleCountdown = (data: unknown) => {
      const { count } = data as { count: number };
      setCountdown(count);
    };

    const handleGameStart = () => {
      setIsPlaying(true);
      setCountdown(null);
    };

    const handleGameEnd = (state: unknown) => {
      setGameState(state as GameState);
      setIsPlaying(false);
    };

    const handleSpectatorJoin = (data: unknown) => {
      const { userId } = data as { userId: string };
      addSpectator(userId);
    };

    const handleSpectatorLeave = (data: unknown) => {
      const { userId } = data as { userId: string };
      removeSpectator(userId);
    };

    on('game:state', handleGameState);
    on('game:player-joined', handlePlayerJoined);
    on('game:player-left', handlePlayerLeft);
    on('game:move', handleMoveMade);
    on('game:countdown', handleCountdown);
    on('game:start', handleGameStart);
    on('game:end', handleGameEnd);
    on('game:spectator-join', handleSpectatorJoin);
    on('game:spectator-leave', handleSpectatorLeave);

    return () => {
      off('game:state');
      off('game:player-joined');
      off('game:player-left');
      off('game:move');
      off('game:countdown');
      off('game:start');
      off('game:end');
      off('game:spectator-join');
      off('game:spectator-leave');
    };
  }, [on, off, setGameState, setPlayers, addMove, setCountdown, setIsPlaying, setRoom, addSpectator, removeSpectator]);

  const joinRoom = useCallback(
    (roomId: string) => emit('game:join-room', { roomId }),
    [emit]
  );

  const leaveRoom = useCallback(
    (roomId: string) => emit('game:leave-room', { roomId }),
    [emit]
  );

  const makeMove = useCallback(
    (move: { position: unknown; roomId: string }) => emit('game:move', move),
    [emit]
  );

  const ready = useCallback(
    (roomId: string) => emit('game:ready', { roomId }),
    [emit]
  );

  const surrender = useCallback(
    (roomId: string) => emit('game:surrender', { roomId }),
    [emit]
  );

  const startMatchmaking = useCallback(
    (gameSlug: string) => emit('game:matchmaking', { gameSlug }),
    [emit]
  );

  const cancelMatchmaking = useCallback(
    () => emit('game:cancel-matchmaking'),
    [emit]
  );

  return { joinRoom, leaveRoom, makeMove, ready, surrender, startMatchmaking, cancelMatchmaking };
}

export function useChatSocket() {
  const { emit, on, off } = useSocketStore();
  const { addMessage, setTypingUser, updateLastMessage } = useChatStore();

  useEffect(() => {
    const handleNewMessage = (message: unknown) => {
      const msg = message as Message;
      addMessage(msg.conversationId, msg);
      updateLastMessage(msg.conversationId, msg);
    };

    const handleTyping = (data: unknown) => {
      const { conversationId, userId, isTyping } = data as { conversationId: string; userId: string; isTyping: boolean };
      setTypingUser(conversationId, userId, isTyping);
    };

    on('chat:message', handleNewMessage);
    on('chat:typing', handleTyping);

    return () => {
      off('chat:message');
      off('chat:typing');
    };
  }, [on, off, addMessage, setTypingUser, updateLastMessage]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) =>
      emit('chat:send', { conversationId, content }),
    [emit]
  );

  const startTyping = useCallback(
    (conversationId: string) => emit('chat:typing', { conversationId, isTyping: true }),
    [emit]
  );

  const stopTyping = useCallback(
    (conversationId: string) => emit('chat:typing', { conversationId, isTyping: false }),
    [emit]
  );

  const joinChatRoom = useCallback(
    (conversationId: string) => emit('chat:join', { conversationId }),
    [emit]
  );

  return { sendMessage, startTyping, stopTyping, joinChatRoom };
}

export function useNotificationSocket() {
  const { on, off } = useSocketStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const handleNotification = (notification: unknown) => {
      addNotification(notification as Notification);
    };

    on('notification:new', handleNotification);

    return () => {
      off('notification:new');
    };
  }, [on, off, addNotification]);
}

export function usePresence() {
  const { onlineUsers } = useSocketStore();

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  return { onlineUsers, isUserOnline };
}
