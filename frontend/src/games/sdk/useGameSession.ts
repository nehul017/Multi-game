'use client';

import { useCallback, useRef, useState } from 'react';
import { gameService, type GameCompletePayload, type GameSessionPayload } from '@/services/game.service';

export function useGameSession(gameType: string) {
  const sessionRef = useRef<GameSessionPayload | null>(null);
  const completingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<GameSessionPayload | null>(null);

  const start = useCallback(
    async (settings?: Record<string, unknown>) => {
      setError(null);
      const response = await gameService.startSession(gameType, settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not start game session');
      }
      sessionRef.current = response.data;
      return response.data;
    },
    [gameType]
  );

  const complete = useCallback(async (payload: GameCompletePayload) => {
    const session = sessionRef.current;
    if (!session || completingRef.current) return null;
    completingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const response = await gameService.completeMatch(session.matchId || session.sessionId, payload);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not save game result');
      }
      setLastResult(response.data);
      sessionRef.current = null;
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save game result';
      setError(message);
      throw err;
    } finally {
      completingRef.current = false;
      setSaving(false);
    }
  }, []);

  const recordScore = useCallback(async (payload: GameCompletePayload, matchId?: string) => {
    const id = matchId || sessionRef.current?.matchId || sessionRef.current?.sessionId;
    if (!id) return null;
    try {
      const response = await gameService.recordScore(id, payload);
      return response.success ? response.data : null;
    } catch {
      return null;
    }
  }, []);

  const abort = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || completingRef.current) return;
    const id = session.matchId || session.sessionId;
    sessionRef.current = null;
    try {
      await gameService.abortSession(id);
    } catch {
      /* session may already be finished */
    }
  }, []);

  const clear = useCallback(() => {
    sessionRef.current = null;
    completingRef.current = false;
  }, []);

  return { start, complete, recordScore, abort, clear, error, saving, lastResult, session: sessionRef };
}