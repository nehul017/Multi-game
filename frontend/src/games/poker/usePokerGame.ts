'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useSocketStore } from '@/store/socket.store';
import { SOCKET_EVENTS } from '@/constants/socket';
import { toId } from '@/lib/id';
import { pokerApi } from './api';
import type {
  GameErrorPayload,
  LobbyTable,
  PokerActionType,
  PokerGameState,
  PokerGameType,
  PokerHistoryItem,
  PokerPublicConfig,
  PokerVariantInfo,
} from './types';

const POKER = SOCKET_EVENTS.POKER;

export function usePokerGame() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: walletRes } = useWallet();
  const { gameOn, gameOff, gameEmit, isGameConnected } = useSocketStore();

  const [view, setView] = useState<'modes' | 'lobby' | 'table'>('modes');
  const [mode, setMode] = useState<PokerGameType | 'all'>('all');
  const [tables, setTables] = useState<LobbyTable[]>([]);
  const [variants, setVariants] = useState<Record<string, PokerVariantInfo> | null>(null);
  const [config, setConfig] = useState<PokerPublicConfig | null>(null);
  const [table, setTable] = useState<PokerGameState | null>(null);
  const [history, setHistory] = useState<PokerHistoryItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [buyIn, setBuyIn] = useState(400);
  const [discardIndexes, setDiscardIndexes] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const myId = toId(user?.id);
  const tableParam = searchParams.get('table');

  useEffect(() => {
    const coins = walletRes?.data?.coins;
    if (typeof coins === 'number') setBalance(coins);
  }, [walletRes]);

  const applyConfig = useCallback((next?: PokerPublicConfig | null) => {
    if (!next) return;
    setConfig(next);
    if (next.variants) setVariants(next.variants);
  }, []);

  const refreshLobby = useCallback(async () => {
    try {
      const res = await pokerApi.listTables();
      setTables(res.data || []);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Could not load live tables');
    }
  }, []);

  useEffect(() => {
    pokerApi
      .getConfig()
      .then((res) => applyConfig(res.data))
      .catch(() => setError((current) => current || 'Could not load poker rules'));
  }, [applyConfig]);

  useEffect(() => {
    if (view === 'modes' || view === 'lobby') {
      void refreshLobby();
    }
  }, [view, refreshLobby]);

  useEffect(() => {
    if (!isGameConnected) {
      setReconnecting(true);
      return;
    }
    setReconnecting(false);

    const onState = (payload: unknown) => setTable(payload as PokerGameState);
    const onLobby = (payload: unknown) => {
      const data = payload as { tables?: LobbyTable[]; config?: PokerPublicConfig };
      if (data.tables) setTables(data.tables);
      if (data.config) applyConfig(data.config);
    };
    const onError = (payload: unknown) => {
      const err = payload as GameErrorPayload;
      setError(err.message);
      setBusy(false);
    };
    const onRejected = (payload: unknown) => {
      const err = payload as { message?: string };
      setError(err.message || 'Action rejected');
      setBusy(false);
    };
    const onBalance = (payload: unknown) => {
      const data = payload as { userId?: string; balance?: number };
      if (data.userId === myId && typeof data.balance === 'number') {
        setBalance(data.balance);
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    };
    const onReconnect = (payload: unknown) => {
      const data = payload as { restored?: boolean };
      setReconnecting(false);
      if (data.restored) setView('table');
    };

    gameOn(POKER.TABLE_STATE, onState);
    gameOn(POKER.LOBBY, onLobby);
    gameOn(POKER.ERROR, onError);
    gameOn(POKER.ACTION_REJECTED, onRejected);
    gameOn(POKER.BALANCE_UPDATE, onBalance);
    gameOn(POKER.RECONNECT, onReconnect);
    gameOn(POKER.SHOWDOWN, onState);
    gameOn(POKER.HAND_RESULT, onState);

    gameEmit(POKER.RECONNECT, tableParam ? { tableId: tableParam } : {});
    gameEmit(POKER.LOBBY, {});

    return () => {
      gameOff(POKER.TABLE_STATE, onState);
      gameOff(POKER.LOBBY, onLobby);
      gameOff(POKER.ERROR, onError);
      gameOff(POKER.ACTION_REJECTED, onRejected);
      gameOff(POKER.BALANCE_UPDATE, onBalance);
      gameOff(POKER.RECONNECT, onReconnect);
      gameOff(POKER.SHOWDOWN, onState);
      gameOff(POKER.HAND_RESULT, onState);
    };
  }, [isGameConnected, gameOn, gameOff, gameEmit, myId, queryClient, tableParam, applyConfig]);

  useEffect(() => {
    if (tableParam && isGameConnected) {
      setView('table');
      pokerApi.getTable(tableParam).then((res) => setTable(res.data)).catch(() => undefined);
    }
  }, [tableParam, isGameConnected]);

  const selectMode = (next: PokerGameType | 'all') => {
    setMode(next);
    setView('lobby');
  };

  const sitAndEnter = async (tableId: string, amount?: number) => {
    const chip = Math.max(200, Math.min(amount ?? buyIn, balance > 0 ? balance : amount ?? buyIn));
    setBusy(true);
    setError(null);
    const res = await pokerApi.sit({ tableId, buyIn: chip });
    setTable(res.data);
    setView('table');
    gameEmit(POKER.TABLE_JOIN, { tableId, buyIn: chip });
    setBusy(false);
    return res.data;
  };

  const joinTable = (tableId: string, amount?: number) => {
    void sitAndEnter(tableId, amount).catch((err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Could not sit at this table');
      setBusy(false);
      setView('lobby');
    });
  };

  const quickJoin = (gameType: PokerGameType) => {
    setBusy(true);
    setError(null);
    void (async () => {
      const list = await pokerApi.listTables(gameType);
      const open = (list.data || []).filter((item) => !item.fillBots);
      const target = open[0];
      if (!target) {
        setError('No open cash table for this game yet');
        setBusy(false);
        return;
      }
      await sitAndEnter(target.tableId, Math.max(target.buyIn.min, buyIn));
    })().catch((err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Could not sit at a cash table');
      setBusy(false);
    });
  };

  const leaveTable = () => {
    if (table) gameEmit(POKER.TABLE_LEAVE, { tableId: table.tableId });
    setTable(null);
    setView('lobby');
    setDiscardIndexes([]);
  };

  const sendAction = (type: PokerActionType, amount?: number) => {
    if (!table) return;
    setBusy(true);
    setError(null);
    gameEmit(POKER.ACTION, { tableId: table.tableId, type, amount });
    setTimeout(() => setBusy(false), 400);
  };

  const sendDraw = () => {
    if (!table) return;
    gameEmit(POKER.DRAW, { tableId: table.tableId, discardIndexes });
    setDiscardIndexes([]);
  };

  const toggleDiscard = (index: number) => {
    setDiscardIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

  const loadHistory = async () => {
    const res = await pokerApi.getHistory(table?.tableId);
    setHistory(res.data || []);
  };

  const isMyTurn = Boolean(table && myId && table.currentPlayerId === myId);
  const me = useMemo(() => table?.players.find((player) => player.userId === myId), [table, myId]);

  return {
    view,
    setView,
    mode,
    selectMode,
    tables,
    variants,
    config,
    table,
    history,
    balance,
    error,
    setError,
    reconnecting,
    buyIn,
    setBuyIn,
    discardIndexes,
    toggleDiscard,
    busy,
    myId,
    me,
    isMyTurn,
    isGameConnected,
    refreshLobby,
    joinTable,
    quickJoin,
    leaveTable,
    sendAction,
    sendDraw,
    loadHistory,
  };
}
