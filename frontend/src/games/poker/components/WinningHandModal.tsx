'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PokerCard, PokerGameType } from '../types';
import {
  formatChipAmount,
  formatHandNotation,
  formatSignedChips,
  handCategoryLabel,
  usedCardsForHand,
  usesOmahaSplit,
  winningCardSet,
  type WinningHandEntry,
  type WinningHandView,
} from '../winningHand';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayingCard } from './PlayingCard';

function useCountUp(amount: number, active: boolean, delayMs: number): number {
  const [value, setValue] = useState(amount);

  useEffect(() => {
    if (!active) {
      setValue(amount);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(amount);
      return;
    }
    let frame = 0;
    const startTimer = window.setTimeout(() => {
      const started = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / 420);
        setValue(Math.round(amount * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(startTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [active, amount, delayMs]);

  return value;
}

function WinnerIdentity({
  entry,
  amount,
  kicker,
}: {
  entry: WinningHandEntry;
  amount?: number;
  kicker?: string;
}) {
  return (
    <div className="pk-win-identity">
      <span className="pk-win-glow" aria-hidden />
      <PlayerAvatar name={entry.username} src={entry.avatar} bot={entry.isBot} />
      <div>
        <strong>{entry.username}</strong>
        {kicker ? <em>{kicker}</em> : null}
        {typeof amount === 'number' ? <span>{formatSignedChips(amount)}</span> : null}
      </div>
    </div>
  );
}

function WinningCardRow({
  cards,
  usedHoleCards,
  usedCommunityCards,
  gameType,
  highlightIds,
  startDelay,
  label,
}: {
  cards: PokerCard[];
  usedHoleCards?: PokerCard[];
  usedCommunityCards?: PokerCard[];
  gameType: PokerGameType;
  highlightIds: Set<string>;
  startDelay: number;
  label?: string;
}) {
  if (cards.length === 0) return null;
  const hole = usedHoleCards || [];
  const board = usedCommunityCards || [];
  const omaha = usesOmahaSplit(gameType) && hole.length + board.length > 0;

  if (omaha) {
    const renderGroup = (group: PokerCard[], kind: 'hole' | 'board', offset: number) =>
      group.length ? (
        <div className={`pk-win-card-group is-${kind}`}>
          <span>{kind === 'hole' ? 'Hole cards' : 'Community cards'}</span>
          <div className="pk-win-cards">
            {group.map((card, index) => (
              <PlayingCard
                key={`${kind}-${card.id}`}
                card={card}
                featured
                winner={highlightIds.has(card.id)}
                delay={startDelay + (offset + index) * 90}
              />
            ))}
          </div>
        </div>
      ) : null;

    return (
      <div className="pk-win-hand-visual">
        {label ? <p className="pk-win-kicker">{label}</p> : null}
        <div className="pk-win-omaha">
          {renderGroup(hole, 'hole', 0)}
          {renderGroup(board, 'board', hole.length)}
        </div>
      </div>
    );
  }

  return (
    <div className="pk-win-hand-visual">
      {label ? <p className="pk-win-kicker">{label}</p> : null}
      <div className="pk-win-cards">
        {cards.map((card, index) => (
          <PlayingCard
            key={card.id}
            card={card}
            featured
            winner={highlightIds.has(card.id)}
            delay={startDelay + index * 90}
          />
        ))}
      </div>
    </div>
  );
}

function CombinationBlock({
  category,
  handName,
  cards,
  fallback,
}: {
  category?: string;
  handName?: string;
  cards: PokerCard[];
  fallback?: string;
}) {
  const title = category ? handCategoryLabel(category, handName) : (handName || fallback || '').toUpperCase();
  if (!title && cards.length === 0) return null;
  return (
    <div className="pk-win-combo">
      {title ? <h3>{title}</h3> : null}
      {cards.length > 0 ? <p>{formatHandNotation(cards)}</p> : null}
    </div>
  );
}

function PrimaryWinningHand({
  entry,
  gameType,
  communityCards,
}: {
  entry: WinningHandEntry;
  gameType: PokerGameType;
  communityCards: PokerCard[];
}) {
  const used = usedCardsForHand(entry.winningCards, entry, communityCards, 'high');
  return (
    <>
      <WinningCardRow
        cards={entry.winningCards}
        usedHoleCards={used.usedHoleCards}
        usedCommunityCards={used.usedCommunityCards}
        gameType={gameType}
        highlightIds={winningCardSet(entry, 'high')}
        startDelay={600}
      />
      <CombinationBlock category={entry.category} handName={entry.handName} cards={entry.winningCards} />
    </>
  );
}

function WinnerHandBlock({
  entry,
  gameType,
  communityCards,
  kind,
  startDelay,
  showIdentityAmount,
  kicker,
}: {
  entry: WinningHandEntry;
  gameType: PokerGameType;
  communityCards: PokerCard[];
  kind: 'high' | 'low';
  startDelay: number;
  showIdentityAmount?: boolean;
  kicker?: string;
}) {
  const cards = kind === 'low' ? entry.lowWinningCards : entry.winningCards;
  const used = usedCardsForHand(cards, entry, communityCards, kind);
  return (
    <div>
      <WinnerIdentity
        entry={entry}
        amount={showIdentityAmount ? entry.totalWon : undefined}
        kicker={kicker}
      />
      <WinningCardRow
        cards={cards}
        usedHoleCards={used.usedHoleCards}
        usedCommunityCards={used.usedCommunityCards}
        gameType={gameType}
        highlightIds={winningCardSet(entry, kind)}
        startDelay={startDelay}
        label={kind === 'low' ? 'Low hand' : undefined}
      />
      <CombinationBlock
        category={kind === 'high' ? entry.category : undefined}
        handName={kind === 'low' ? entry.lowHandName : entry.handName}
        cards={cards}
        fallback={kind === 'low' ? 'Low hand' : undefined}
      />
    </div>
  );
}

export function WinningHandModal({
  open,
  view,
  gameType,
  communityCards,
  onContinue,
}: {
  open: boolean;
  view: WinningHandView | null;
  gameType: PokerGameType;
  communityCards: PokerCard[];
  onContinue: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const counted = useCountUp(view?.totalWon || 0, Boolean(open && view && !view.empty), 1200);

  useEffect(() => {
    if (!open) return;
    continueRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onContinue, view?.resultKey]);

  if (!open || !view) return null;

  const primary = view.highWinners[0] || view.winners[0];
  const showPots = view.pots.length > 1;

  return (
    <div
      className="pk-win-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="pk-win-backdrop" aria-hidden />
      <div className="pk-win-modal" key={view.resultKey}>
        <div className="pk-win-particles" aria-hidden>
          {Array.from({ length: 14 }, (_, index) => (
            <i key={index} style={{ ['--i' as string]: index }} />
          ))}
        </div>

        <div className="pk-win-body">
        <p className="pk-win-kicker" id={titleId}>
          🏆 {view.headline}
        </p>

        {view.foldedWatcher && (
          <div className="pk-win-folded" role="status">
            <strong>You folded</strong>
            <span>Watching the hand</span>
          </div>
        )}

        {view.empty ? (
          <div className="pk-win-empty" id={descId}>
            <p>No awarded pot for this hand.</p>
          </div>
        ) : (
          <div id={descId}>
            {view.hasLow ? (
              <div className="pk-win-split">
                <section>
                  <p className="pk-win-kicker">High winner</p>
                  {view.highWinners.map((entry) => (
                    <WinnerHandBlock
                      key={`high-${entry.userId}`}
                      entry={entry}
                      gameType={gameType}
                      communityCards={communityCards}
                      kind="high"
                      startDelay={600}
                      kicker={entry.scooped ? 'Won high and low' : undefined}
                    />
                  ))}
                </section>
                <section>
                  <p className="pk-win-kicker">Low winner</p>
                  {view.lowWinners.map((entry) => (
                    <WinnerHandBlock
                      key={`low-${entry.userId}`}
                      entry={entry}
                      gameType={gameType}
                      communityCards={communityCards}
                      kind="low"
                      startDelay={720}
                      kicker={entry.scooped ? 'Same player · scooped' : undefined}
                    />
                  ))}
                </section>
              </div>
            ) : (
              <>
                {view.winners.map((entry) => (
                  <WinnerIdentity key={entry.userId} entry={entry} amount={entry.totalWon} />
                ))}
                {view.uncontested ? (
                  <p className="pk-win-uncontested">Won uncontested — remaining players folded.</p>
                ) : (
                  <>
                    <p className="pk-win-kicker">Winning hand</p>
                    {primary ? (
                      <PrimaryWinningHand
                        entry={primary}
                        gameType={gameType}
                        communityCards={communityCards}
                      />
                    ) : null}
                    {view.splitHigh &&
                      view.highWinners.slice(1).map((entry) =>
                        entry.winningCards.length > 0 &&
                        formatHandNotation(entry.winningCards) !== formatHandNotation(primary?.winningCards || []) ? (
                          <div key={`split-${entry.userId}`} className="pk-win-split-extra">
                            <WinningCardRow
                              cards={entry.winningCards}
                              usedHoleCards={entry.usedHoleCards}
                              usedCommunityCards={entry.usedCommunityCards}
                              gameType={gameType}
                              highlightIds={winningCardSet(entry, 'high')}
                              startDelay={600}
                            />
                            <CombinationBlock
                              category={entry.category}
                              handName={entry.handName}
                              cards={entry.winningCards}
                            />
                          </div>
                        ) : null
                      )}
                  </>
                )}
              </>
            )}

            <div className="pk-win-pot">
              <p className="pk-win-kicker">Pot won</p>
              {showPots ? (
                <ul>
                  {view.pots.map((pot) => (
                    <li key={pot.potId}>
                      <span>{pot.label}</span>
                      <strong>{formatChipAmount(pot.amount)}</strong>
                    </li>
                  ))}
                  <li className="is-total">
                    <span>Total won</span>
                    <strong>{formatChipAmount(counted)}</strong>
                  </li>
                </ul>
              ) : (
                <p className="pk-win-pot-value">{formatChipAmount(counted)}</p>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="pk-win-footer">
          <button ref={continueRef} type="button" className="pk-btn is-gold pk-win-continue" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
