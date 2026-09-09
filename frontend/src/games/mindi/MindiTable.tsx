'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { toId } from '@/lib/id';
import { MindiHUD } from './components/MindiHUD';
import { MindiSeat } from './components/MindiSeat';
import { MindiTrickArea } from './components/MindiTrickArea';
import { MindiPlayerHand } from './components/MindiPlayerHand';
import { MindiGameControls } from './components/MindiGameControls';
import { MindiGameResult } from './components/MindiGameResult';
import { MindiSurrenderModal } from './components/MindiSurrenderModal';
import { useMindiSounds } from './useMindiSounds';
import type { MindiBoard, MindiCompletedTrick, MindiSeat as MindiSeatData, MindiSeatSlot, MindiTeam } from './types';

interface PlayerMeta {
  userId: string;
  username: string;
  avatar?: string;
  connected?: boolean;
}

interface MindiTableProps {
  board?: unknown;
  players: PlayerMeta[];
  currentUserId: string;
  disabled?: boolean;
  isMyTurn?: boolean;
  gameStatus?: string;
  onPlayCard: (cardId: string) => void;
  onSurrender?: () => void;
  onPlayAgain?: () => void;
  onExit?: () => void;
}

const SLOT_ORDER: MindiSeatSlot[] = ['bottom', 'right', 'top', 'left'];

function asBoard(board: unknown): MindiBoard {
  return (board && typeof board === 'object' ? board : {}) as MindiBoard;
}

function rotateSeats(mySeat: number): Record<number, MindiSeatSlot> {
  const map: Record<number, MindiSeatSlot> = {};
  for (let i = 0; i < 4; i += 1) {
    map[(mySeat + i) % 4] = SLOT_ORDER[i];
  }
  return map;
}

function emptySeat(seat: number, player?: PlayerMeta): MindiSeatData {
  return {
    seat,
    playerId: player?.userId || `empty:${seat}`,
    team: seat % 2 === 0 ? 'A' : 'B',
    cardCount: 0,
    isBot: Boolean(player?.userId.startsWith('bot:')),
    isDealer: false,
    isLeader: false,
  };
}

export function MindiTable({
  board,
  players,
  currentUserId,
  disabled,
  isMyTurn,
  gameStatus,
  onPlayCard,
  onSurrender,
  onPlayAgain,
  onExit,
}: MindiTableProps) {
  const reduce = useReducedMotion();
  const sounds = useMindiSounds();
  const state = asBoard(board);
  const shellRef = useRef<HTMLDivElement>(null);
  const lastTrickCount = useRef(0);
  const lastTens = useRef(0);
  const lastTurn = useRef<string | null>(null);
  const dealt = useRef(false);
  const collectTimer = useRef<number | undefined>(undefined);
  const dealTimer = useRef<number | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmSurrender, setConfirmSurrender] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [collecting, setCollecting] = useState<MindiCompletedTrick | null>(null);
  const [tenFlash, setTenFlash] = useState(false);

  const liveSeats = state.seats || [];
  const seats = useMemo(() => {
    if (liveSeats.length === 4) return liveSeats;
    return Array.from({ length: 4 }, (_, seat) => emptySeat(seat, players[seat]));
  }, [liveSeats, players]);

  const mySeat = state.mySeat ?? seats.find((seat) => toId(seat.playerId) === toId(currentUserId))?.seat ?? 0;
  const layout = useMemo(() => rotateSeats(mySeat), [mySeat]);
  const hand = state.myHand || [];
  const legal = useMemo(() => new Set(state.legalCardIds || []), [state.legalCardIds]);
  const playerMap = useMemo(
    () => new Map(players.map((player) => [toId(player.userId), player])),
    [players]
  );

  useEffect(() => {
    sounds.unlock();
  }, [sounds]);

  useEffect(() => {
    if (!hand.length || dealt.current) return;
    dealt.current = true;
    sounds.playShuffle();
    sounds.playDeal();
    if (reduce) return;
    setDealing(true);
    dealTimer.current = window.setTimeout(() => setDealing(false), 1100);
    return () => {
      if (dealTimer.current) window.clearTimeout(dealTimer.current);
    };
  }, [hand.length, sounds, reduce]);

  useEffect(() => {
    const count = state.completedTrickCount || 0;
    if (count > lastTrickCount.current) {
      sounds.playTrick();
      const tens = (state.capturedTens?.A || 0) + (state.capturedTens?.B || 0);
      if (tens > lastTens.current) {
        sounds.playTen();
        setTenFlash(true);
        flashTimer.current = window.setTimeout(() => setTenFlash(false), 900);
      }
      lastTens.current = tens;
      if (state.lastTrick && !reduce) {
        setCollecting(state.lastTrick);
        collectTimer.current = window.setTimeout(() => setCollecting(null), 720);
      }
    }
    lastTrickCount.current = count;
  }, [state.completedTrickCount, state.capturedTens, state.lastTrick, sounds, reduce]);

  useEffect(() => {
    const turn = String(state.currentSeat ?? '');
    if (lastTurn.current === turn) return;
    if (isMyTurn) sounds.playTurn();
    lastTurn.current = turn;
    setSelectedId(null);
  }, [isMyTurn, state.currentSeat, sounds]);

  const winnerTeam = state.winnerTeam;
  const iWon = winnerTeam
    ? seats.some((seat) => seat.team === winnerTeam && toId(seat.playerId) === toId(currentUserId))
    : false;

  useEffect(() => {
    if (gameStatus !== 'finished') return;
    sounds.playRound();
    if (iWon) sounds.playWin();
    else sounds.playLoss();
  }, [gameStatus, iWon, sounds]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (collectTimer.current) window.clearTimeout(collectTimer.current);
      if (dealTimer.current) window.clearTimeout(dealTimer.current);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const playCard = useCallback(
    (cardId: string) => {
      if (disabled || !isMyTurn || !legal.has(cardId)) return;
      sounds.playSlide();
      sounds.playCard();
      setSelectedId(null);
      onPlayCard(cardId);
    },
    [disabled, isMyTurn, legal, onPlayCard, sounds]
  );

  const onSelect = useCallback(
    (cardId: string) => {
      if (disabled || !isMyTurn || !legal.has(cardId)) return;
      if (selectedId === cardId) {
        playCard(cardId);
        return;
      }
      sounds.playPickup();
      setSelectedId(cardId);
    },
    [disabled, isMyTurn, legal, playCard, selectedId, sounds]
  );

  const playable = useMemo(() => hand.filter((card) => legal.has(card.id)).map((card) => card.id), [hand, legal]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMyTurn || disabled || !playable.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const current = selectedId && playable.includes(selectedId) ? playable.indexOf(selectedId) : -1;
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = playable[(current + delta + playable.length) % playable.length];
      setSelectedId(next);
      sounds.playClick();
    }
    if ((event.key === 'Enter' || event.key === ' ') && selectedId) {
      event.preventDefault();
      playCard(selectedId);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch {
      /* browser / iframe restrictions */
    }
  };

  const teamScore = (team: MindiTeam) => ({
    tens: state.capturedTens?.[team] ?? 0,
    tricks: state.tricksWon?.[team] ?? 0,
  });

  return (
    <div
      ref={shellRef}
      className={`mindi-shell ${fullscreen ? 'is-fullscreen' : ''}`}
      tabIndex={0}
      onPointerDown={sounds.unlock}
      onKeyDown={onKeyDown}
    >
      <MindiHUD
        roundNumber={state.roundNumber}
        teamA={teamScore('A')}
        teamB={teamScore('B')}
        trumpSuit={state.trumpSuit}
        trumpRevealed={state.trumpRevealed}
        lastTrick={state.lastTrick}
        muted={sounds.muted}
        fullscreen={fullscreen}
        onToggleMute={() => sounds.setMuted((value) => !value)}
        onToggleFullscreen={toggleFullscreen}
      />

      <LayoutGroup>
      <motion.div
        className="mindi-stage"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mindi-room-glow" aria-hidden />
          <div className="mindi-table" role="application" aria-label="Mindi Cot table">
            <div className="mindi-table-shadow" aria-hidden />
            <div className="mindi-table-rail" aria-hidden />
            <div className="mindi-table-felt-layer" aria-hidden />
            {seats.map((seat) => {
              const meta = playerMap.get(toId(seat.playerId));
              const slot = layout[seat.seat] || 'bottom';
              return (
                <MindiSeat
                  key={`${seat.seat}-${seat.playerId}`}
                  seat={seat}
                  slot={slot}
                  meta={meta}
                  empty={seat.playerId.startsWith('empty:')}
                  thinking={state.botThinkingSeat === seat.seat}
                  active={state.currentSeat === seat.seat && gameStatus === 'playing'}
                />
              );
            })}
            <MindiTrickArea
              trick={state.currentTrick || []}
              layout={layout}
              isMyTurn={isMyTurn}
              collecting={collecting}
              tenFlash={tenFlash}
              dealing={dealing}
            />
          </div>
      </motion.div>

      <div className="mindi-dock">
        <MindiPlayerHand
          cards={hand}
          legalIds={legal}
          selectedId={selectedId}
          isMyTurn={isMyTurn}
          disabled={disabled}
          dealing={dealing}
          onSelect={onSelect}
          onHover={sounds.playClick}
        />
        <MindiGameControls
          canSurrender={gameStatus === 'playing'}
          onSurrender={() => setConfirmSurrender(true)}
        />
      </div>
      </LayoutGroup>

      <AnimatePresence>
        {gameStatus === 'finished' && (
          <MindiGameResult board={state} iWon={iWon} onPlayAgain={onPlayAgain} onExit={onExit} />
        )}
      </AnimatePresence>

      <MindiSurrenderModal
        open={confirmSurrender}
        onCancel={() => setConfirmSurrender(false)}
        onConfirm={() => {
          setConfirmSurrender(false);
          onSurrender?.();
        }}
      />
    </div>
  );
}
