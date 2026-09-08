'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks';
import { useSocketStore } from '@/store/socket.store';
import { SOCKET_EVENTS } from '@/constants/socket';
import { fruitSlotsApi } from './api';
import { fruitSlotsAudio } from './audio';
import {
  DEFAULT_REELS,
  FRUIT_SLOTS_GAME_ID,
  type FruitSlotsHistoryItem,
  type FruitSlotsSpinResult,
  type FruitSlotsState,
  type GameErrorPayload,
  type PublicFruitSlotsConfig,
  type ReelGrid,
  type WinningLine,
} from './types';

export const FALLBACK_CONFIG: PublicFruitSlotsConfig = {
  gameId: FRUIT_SLOTS_GAME_ID,
  name: 'Classic Fruit Slots',
  reelCount: 5,
  rowCount: 3,
  minBet: 10,
  maxBet: 500,
  betStep: 5,
  betPresets: [10, 25, 50, 100, 250, 500],
  symbols: [
    { id: 'cherry', name: 'Cherry', asset: 'cherry', rarity: 'common', payouts: { 3: 2, 4: 5, 5: 15 } },
    { id: 'lemon', name: 'Lemon', asset: 'lemon', rarity: 'common', payouts: { 3: 3, 4: 8, 5: 20 } },
    { id: 'orange', name: 'Orange', asset: 'orange', rarity: 'common', payouts: { 3: 4, 4: 10, 5: 25 } },
    { id: 'grapes', name: 'Grapes', asset: 'grapes', rarity: 'uncommon', payouts: { 3: 6, 4: 15, 5: 40 } },
    { id: 'watermelon', name: 'Watermelon', asset: 'watermelon', rarity: 'uncommon', payouts: { 3: 8, 4: 20, 5: 60 } },
    { id: 'bell', name: 'Bell', asset: 'bell', rarity: 'rare', payouts: { 3: 15, 4: 40, 5: 120 } },
    { id: 'seven', name: 'Lucky 7', asset: 'seven', rarity: 'legendary', payouts: { 3: 30, 4: 100, 5: 500 } },
  ],
  paylines: [
    { id: 'middle', name: 'Middle', pattern: [1, 1, 1, 1, 1] },
    { id: 'top', name: 'Top', pattern: [0, 0, 0, 0, 0] },
    { id: 'bottom', name: 'Bottom', pattern: [2, 2, 2, 2, 2] },
    { id: 'v', name: 'V', pattern: [0, 1, 2, 1, 0] },
    { id: 'inverted-v', name: 'Inverted V', pattern: [2, 1, 0, 1, 2] },
    { id: 'diag-down', name: 'Diagonal Down', pattern: [0, 1, 2, 2, 1] },
    { id: 'diag-up', name: 'Diagonal Up', pattern: [2, 1, 0, 0, 1] },
    { id: 'zigzag-high', name: 'High Zigzag', pattern: [0, 1, 0, 1, 0] },
    { id: 'zigzag-low', name: 'Low Zigzag', pattern: [2, 1, 2, 1, 2] },
  ],
};

export function useSlotGame() {
  const queryClient = useQueryClient();
  const { data: walletRes } = useWallet();
  const { gameOn, gameOff, gameEmit, isGameConnected } = useSocketStore();

  const [config, setConfig] = useState<PublicFruitSlotsConfig>(FALLBACK_CONFIG);
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(FALLBACK_CONFIG.minBet);
  const [reels, setReels] = useState<ReelGrid>(DEFAULT_REELS);
  const [resultReels, setResultReels] = useState<ReelGrid | null>(null);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [currentWin, setCurrentWin] = useState(0);
  const [showWinBurst, setShowWinBurst] = useState(false);
  const [history, setHistory] = useState<FruitSlotsHistoryItem[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => fruitSlotsAudio.isMuted());
  const [joined, setJoined] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  const pendingResult = useRef<FruitSlotsSpinResult | null>(null);
  const spinningRef = useRef(false);

  useEffect(() => {
    const coins = walletRes?.data?.coins;
    if (typeof coins === 'number' && !spinningRef.current) {
      setBalance(coins);
    }
  }, [walletRes]);

  useEffect(() => {
    fruitSlotsApi
      .getConfig()
      .then((res) => {
        if (res.data) {
          setConfig(res.data);
          setBet((current) => current || res.data.minBet);
        }
      })
      .catch(() => undefined);

    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      fruitSlotsApi
        .getHistory()
        .then((res) => {
          if (res.data) setHistory(res.data);
        })
        .catch(() => undefined);
    }
  }, []);

  const joinGame = useCallback(() => {
    if (!useSocketStore.getState().isGameConnected) return;
    gameEmit(SOCKET_EVENTS.GAME.JOIN, { gameId: FRUIT_SLOTS_GAME_ID });
  }, [gameEmit]);

  useEffect(() => {
    const onState = (raw: unknown) => {
      const state = raw as FruitSlotsState;
      if (!state || state.gameId !== FRUIT_SLOTS_GAME_ID) return;
      setJoined(true);
      setBalance(state.balance);
      if (state.currentBet) setBet(state.currentBet);
      setLastWin(state.lastWin || 0);
      if (state.lastReels) setReels(state.lastReels);
      setWinningLines(state.lastWinningLines || []);
      setError(null);
    };

    const onBalance = (raw: unknown) => {
      const payload = raw as { balance?: number };
      if (typeof payload?.balance === 'number' && !spinningRef.current) {
        setBalance(payload.balance);
      }
    };

    const onHistory = (raw: unknown) => {
      const payload = raw as { items?: FruitSlotsHistoryItem[] };
      if (Array.isArray(payload?.items)) setHistory(payload.items);
    };

    const onResult = (raw: unknown) => {
      const result = raw as FruitSlotsSpinResult;
      if (!result?.reels) return;
      pendingResult.current = result;
      setResultReels(result.reels);
      setWinningLines(result.winningLines || []);
    };

    const onError = (raw: unknown) => {
      const payload = raw as GameErrorPayload;
      setError(payload?.message || 'Something went wrong');
      setAutoSpin(false);
      fruitSlotsAudio.play('error');
      spinningRef.current = false;
      setSpinning(false);
      setBusy(false);
      setResultReels(null);
      pendingResult.current = null;
    };

    gameOn(SOCKET_EVENTS.GAME.STATE, onState);
    gameOn(SOCKET_EVENTS.GAME.BALANCE, onBalance);
    gameOn(SOCKET_EVENTS.GAME.HISTORY, onHistory);
    gameOn(SOCKET_EVENTS.GAME.SPIN_RESULT, onResult);
    gameOn(SOCKET_EVENTS.GAME.ERROR, onError);

    return () => {
      gameOff(SOCKET_EVENTS.GAME.STATE, onState);
      gameOff(SOCKET_EVENTS.GAME.BALANCE, onBalance);
      gameOff(SOCKET_EVENTS.GAME.HISTORY, onHistory);
      gameOff(SOCKET_EVENTS.GAME.SPIN_RESULT, onResult);
      gameOff(SOCKET_EVENTS.GAME.ERROR, onError);
    };
  }, [gameOn, gameOff]);

  useEffect(() => {
    joinGame();
    const unsub = useSocketStore.subscribe((state, prev) => {
      if (state.isGameConnected && !prev.isGameConnected) {
        joinGame();
      }
    });
    return () => {
      unsub();
      gameEmit(SOCKET_EVENTS.GAME.LEAVE, { gameId: FRUIT_SLOTS_GAME_ID });
    };
  }, [joinGame, gameEmit]);

  const finishSpin = useCallback(() => {
    const result = pendingResult.current;
    if (result) {
      setReels(result.reels);
      setWinningLines(result.winningLines);
      setBalance(result.balanceAfter);
      setLastWin(result.winAmount);
      setCurrentWin(result.winAmount);
      setShowWinBurst(result.winAmount > 0);
      if (result.winAmount >= result.bet * 20) {
        fruitSlotsAudio.play('bigWin');
      } else if (result.winAmount > 0) {
        fruitSlotsAudio.play('win');
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    }
    pendingResult.current = null;
    spinningRef.current = false;
    setSpinning(false);
    setBusy(false);
    setResultReels(null);
  }, [queryClient]);

  const spin = useCallback(() => {
    if (busy || spinning || !isGameConnected) return;
    if (balance < bet) {
      setError('Not enough coins for this bet.');
      setAutoSpin(false);
      fruitSlotsAudio.play('error');
      return;
    }

    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `spin-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setError(null);
    setShowWinBurst(false);
    setCurrentWin(0);
    setWinningLines([]);
    pendingResult.current = null;
    spinningRef.current = true;
    setBusy(true);
    setSpinning(true);
    setResultReels(null);
    fruitSlotsAudio.play('spin');
    gameEmit(SOCKET_EVENTS.GAME.SPIN, {
      gameId: FRUIT_SLOTS_GAME_ID,
      bet,
      requestId,
    });

    window.setTimeout(() => {
      if (!spinningRef.current) return;
      if (!pendingResult.current) {
        setError('The spin timed out. Your balance was not taken twice.');
        setAutoSpin(false);
        spinningRef.current = false;
        setSpinning(false);
        setBusy(false);
        setResultReels(null);
      }
    }, 12000);
  }, [balance, bet, busy, gameEmit, isGameConnected, spinning]);

  useEffect(() => {
    if (!autoSpin || spinning || busy || !joined || !isGameConnected) return undefined;
    if (balance < bet) {
      setAutoSpin(false);
      setError('Auto spin stopped — not enough coins.');
      return undefined;
    }
    const timer = window.setTimeout(() => spin(), 900);
    return () => window.clearTimeout(timer);
  }, [autoSpin, balance, bet, busy, isGameConnected, joined, spin, spinning]);

  const toggleMuted = () => {
    const next = !muted;
    fruitSlotsAudio.setMuted(next);
    setMuted(next);
  };

  const toggleAutoSpin = () => {
    fruitSlotsAudio.play('click');
    setAutoSpin((current) => !current);
  };

  return {
    config,
    balance,
    bet,
    setBet,
    reels,
    resultReels,
    winningLines,
    lastWin,
    currentWin,
    showWinBurst,
    history,
    spinning,
    busy,
    error,
    muted,
    autoSpin,
    joined,
    isGameConnected,
    locked: busy || spinning || !isGameConnected || !joined,
    finishSpin,
    spin,
    toggleMuted,
    toggleAutoSpin,
  };
}
