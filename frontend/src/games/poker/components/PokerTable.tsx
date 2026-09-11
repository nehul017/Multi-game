'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { PokerGameState } from '../types';
import { ActionPanel } from './ActionPanel';
import { ActionTimer } from './ActionTimer';
import { ChipStack } from './ChipStack';
import { CommunityCards } from './CommunityCards';
import { HandStrength } from './WinnerDisplay';
import { PokerSeat } from './PokerSeat';
import { PotDisplay } from './PotDisplay';
import { ShowdownOverlay } from './ShowdownOverlay';

function botEtaSeconds(botFillAt?: number | null): number {
  if (!botFillAt) return 0;
  return Math.max(0, Math.ceil((botFillAt - Date.now()) / 1000));
}

function polar(index: number, total: number, heroSeat: number, radiusX: number, radiusY: number): CSSProperties {
  const relative = ((index - heroSeat) % total + total) % total;
  const angle = Math.PI / 2 + (relative * 2 * Math.PI) / Math.max(total, 1);
  return {
    left: `${50 + Math.cos(angle) * radiusX}%`,
    top: `${50 + Math.sin(angle) * radiusY}%`,
  };
}

export function PokerTable({
  table,
  myId,
  isMyTurn,
  discardIndexes,
  onToggleDiscard,
  onAction,
  onDraw,
  busy,
}: {
  table: PokerGameState;
  myId: string;
  isMyTurn: boolean;
  discardIndexes: number[];
  onToggleDiscard: (index: number) => void;
  onAction: (type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'draw', amount?: number) => void;
  onDraw: () => void;
  busy: boolean;
}) {
  const hero = table.players.find((player) => player.userId === myId);
  const heroSeat = hero?.seatIndex ?? 0;
  const [botEta, setBotEta] = useState(() => botEtaSeconds(table.botFillAt));
  const waitingForPlayers = table.street === 'waiting' || table.street === 'complete';
  const showBotWait = waitingForPlayers && botEta > 0 && table.players.filter((player) => !player.isBot).length < 2;

  useEffect(() => {
    const tick = () => setBotEta(botEtaSeconds(table.botFillAt));
    tick();
    if (!table.botFillAt) return;
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [table.botFillAt]);

  const winners = new Set([
    ...(table.showdown?.highWinners || []),
    ...(table.showdown?.lowWinners || []),
  ]);
  const myReveal = table.showdown?.revealedPlayers.find((player) => player.userId === myId);
  const street = table.street.replace('-', ' ');
  const idleLabel =
    hero?.status === 'folded'
      ? 'You folded · watching the hand'
      : hero?.status === 'all-in'
        ? 'All-in · waiting for the board'
        : showBotWait
          ? `If nobody else sits, bots join in ${botEta}s`
          : `Waiting · ${street}`;

  return (
    <div className="pk-table-wrap">
      <div className="pk-table-stage">
        <div className="pk-room-glow" aria-hidden />
        <div className="pk-table">
          <div className="pk-table-shadow" aria-hidden />
          <div className="pk-table-rail" />
          <div className="pk-table-felt">
            <div className="pk-felt-brand" aria-hidden>
              <span>♠ ♦ ♥ ♣</span>
              <strong>{table.name}</strong>
              <em>{showBotWait ? `Bots in ${botEta}s` : street}</em>
            </div>
            <PotDisplay pot={table.pot} pots={table.sidePots} />
            <CommunityCards cards={table.communityCards} />
            <HandStrength label={myReveal?.handName} />
          </div>
        </div>
        {table.players.map((player) =>
          player.betThisStreet > 0 ? (
            <div
              key={`bet-${player.userId}`}
              className="pk-felt-bet"
              style={polar(player.seatIndex, table.maxSeats, heroSeat, 22, 18)}
            >
              <ChipStack amount={player.betThisStreet} label={player.lastAction} />
            </div>
          ) : null
        )}
        {Array.from({ length: table.maxSeats }).map((_, seatIndex) => {
          const player = table.players.find((item) => item.seatIndex === seatIndex);
          return (
            <PokerSeat
              key={seatIndex}
              player={player}
              isHero={player?.userId === myId}
              isTurn={player?.userId === table.currentPlayerId}
              winner={player ? winners.has(player.userId) : false}
              style={polar(seatIndex, table.maxSeats, heroSeat, 46, 41)}
              selectedDiscards={player?.userId === myId ? discardIndexes : []}
              onToggleDiscard={onToggleDiscard}
              drawSelect={table.street === 'draw' && isMyTurn}
            />
          );
        })}
      </div>
      <ActionTimer deadline={table.actionDeadline} active={isMyTurn} />
      <ActionPanel
        actions={table.allowedActions}
        pot={table.pot}
        disabled={busy || !isMyTurn}
        drawPhase={table.street === 'draw' && isMyTurn}
        discardCount={discardIndexes.length}
        idleLabel={idleLabel}
        onAction={onAction}
        onDraw={onDraw}
      />
      {(table.street === 'showdown' || table.street === 'complete' || table.phase === 'payout') && (
        <ShowdownOverlay showdown={table.showdown} />
      )}
    </div>
  );
}
