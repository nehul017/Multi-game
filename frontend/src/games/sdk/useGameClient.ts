'use client';

import { useEffect, useRef } from 'react';
import { GameClient } from './GameClient';

export function useGameClient(gameType: string, roomId?: string): GameClient {
  const clientRef = useRef<GameClient | null>(null);

  if (!clientRef.current || clientRef.current.gameType !== gameType) {
    clientRef.current?.destroy();
    clientRef.current = new GameClient({ gameId: gameType, gameType, roomId });
  }

  useEffect(() => {
    return () => {
      clientRef.current?.destroy();
      clientRef.current = null;
    };
  }, [gameType]);

  return clientRef.current;
}
