import type {
  PokerCard,
  PokerGameType,
  PublicSeatPlayer,
  ShowdownResult,
  ShowdownWinner,
} from './types';

export const HAND_CATEGORY_LABEL: Record<string, string> = {
  'high-card': 'HIGH CARD',
  'one-pair': 'ONE PAIR',
  'two-pair': 'TWO PAIR',
  'three-of-a-kind': 'THREE OF A KIND',
  straight: 'STRAIGHT',
  flush: 'FLUSH',
  'full-house': 'FULL HOUSE',
  'four-of-a-kind': 'FOUR OF A KIND',
  'straight-flush': 'STRAIGHT FLUSH',
  'royal-flush': 'ROYAL FLUSH',
};

const SUIT_SYMBOL: Record<PokerCard['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function showdownResultKey(handId: string | null, handNumber: number): string | null {
  if (handId) return handId;
  if (handNumber > 0) return `hand-${handNumber}`;
  return null;
}

export function isShowdownStreet(street?: string, phase?: string): boolean {
  return street === 'showdown' || street === 'complete' || phase === 'payout';
}

export function formatCardNotation(card: PokerCard): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function formatHandNotation(cards: PokerCard[]): string {
  return cards.map(formatCardNotation).join(' ');
}

export function formatChipAmount(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSignedChips(amount: number): string {
  const formatted = formatChipAmount(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function handCategoryLabel(category?: string, fallback?: string): string {
  if (category && HAND_CATEGORY_LABEL[category]) return HAND_CATEGORY_LABEL[category];
  return (fallback || 'WINNING HAND').toUpperCase();
}

export function cardIds(cards: PokerCard[] | undefined): string[] {
  return (cards || []).map((card) => card.id);
}

export function partitionUsedCards(
  winningCards: PokerCard[],
  holeCards: PokerCard[] = [],
  communityCards: PokerCard[] = []
): { usedHoleCards: PokerCard[]; usedCommunityCards: PokerCard[] } {
  const holeIds = new Set(cardIds(holeCards));
  const boardIds = new Set(cardIds(communityCards));
  return {
    usedHoleCards: winningCards.filter((card) => holeIds.has(card.id)),
    usedCommunityCards: winningCards.filter((card) => boardIds.has(card.id)),
  };
}

export function usesOmahaSplit(gameType: PokerGameType): boolean {
  return gameType === 'omaha' || gameType === 'omaha-hi-lo';
}

export interface WinningPotRow {
  potId: string;
  label: string;
  amount: number;
  names: string;
}

export interface WinningHandEntry {
  userId: string;
  username: string;
  avatar?: string;
  isBot?: boolean;
  totalWon: number;
  winTypes: Array<ShowdownWinner['winType']>;
  handName?: string;
  lowHandName?: string;
  category?: string;
  holeCards: PokerCard[];
  winningCards: PokerCard[];
  lowWinningCards: PokerCard[];
  usedHoleCards: PokerCard[];
  usedCommunityCards: PokerCard[];
  scooped: boolean;
}

export interface WinningHandView {
  resultKey: string;
  empty: boolean;
  foldedWatcher: boolean;
  uncontested: boolean;
  hasLow: boolean;
  splitHigh: boolean;
  headline: string;
  winners: WinningHandEntry[];
  highWinners: WinningHandEntry[];
  lowWinners: WinningHandEntry[];
  pots: WinningPotRow[];
  totalWon: number;
}

function uniqueCards(cards: PokerCard[]): PokerCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

function findReveal(showdown: ShowdownResult, userId: string) {
  return showdown.revealedPlayers.find((player) => player.userId === userId);
}

function findSeat(players: PublicSeatPlayer[], userId: string) {
  return players.find((player) => player.userId === userId);
}

function cardsForHigh(winner: ShowdownWinner, showdown: ShowdownResult): PokerCard[] {
  if (winner.winningCards?.length) return winner.winningCards;
  const reveal = findReveal(showdown, winner.userId);
  return reveal?.winningCards || [];
}

function cardsForLow(winner: ShowdownWinner, showdown: ShowdownResult): PokerCard[] {
  if (winner.lowWinningCards?.length) return winner.lowWinningCards;
  const reveal = findReveal(showdown, winner.userId);
  return reveal?.lowWinningCards || [];
}

function usedCardsFor(
  winner: ShowdownWinner,
  showdown: ShowdownResult,
  communityCards: PokerCard[],
  kind: 'high' | 'low'
): { usedHoleCards: PokerCard[]; usedCommunityCards: PokerCard[] } {
  const cards = kind === 'low' ? cardsForLow(winner, showdown) : cardsForHigh(winner, showdown);
  if (winner.usedHoleCards?.length || winner.usedCommunityCards?.length) {
    if (kind === 'high' || winner.winType !== 'low') {
      return {
        usedHoleCards: winner.usedHoleCards || [],
        usedCommunityCards: winner.usedCommunityCards || [],
      };
    }
  }
  const reveal = findReveal(showdown, winner.userId);
  return partitionUsedCards(cards, reveal?.holeCards || [], communityCards);
}

export function buildWinningHandView({
  showdown,
  players,
  myId,
  communityCards,
  handId,
  handNumber,
}: {
  showdown: ShowdownResult | null;
  players: PublicSeatPlayer[];
  myId: string;
  communityCards: PokerCard[];
  handId: string | null;
  handNumber: number;
}): WinningHandView | null {
  if (!showdown) return null;

  const resultKey = showdownResultKey(handId, handNumber) || 'showdown';
  const awards = showdown.pots.flatMap((pot) => pot.winners.map((winner) => ({ pot, winner })));
  const me = findSeat(players, myId);
  const foldedWatcher = Boolean(myId) && me?.status === 'folded' && !showdown.highWinners.includes(myId) && !showdown.lowWinners.includes(myId);

  const byUser = new Map<string, WinningHandEntry>();

  for (const { winner } of awards) {
    const existing = byUser.get(winner.userId);
    const seat = findSeat(players, winner.userId);
    const reveal = findReveal(showdown, winner.userId);
    const highCards = winner.winType === 'low' ? [] : cardsForHigh(winner, showdown);
    const lowCards = winner.winType === 'low' || winner.winType === 'high-low' ? cardsForLow(winner, showdown) : [];
    const used = usedCardsFor(
      winner,
      showdown,
      communityCards,
      winner.winType === 'low' ? 'low' : 'high'
    );

    if (!existing) {
      byUser.set(winner.userId, {
        userId: winner.userId,
        username: winner.username,
        avatar: seat?.avatar,
        isBot: seat?.isBot,
        totalWon: winner.share,
        winTypes: [winner.winType],
        handName: winner.handName || reveal?.handName,
        lowHandName: winner.lowHandName || reveal?.lowHandName,
        category: winner.category || reveal?.category,
        holeCards: reveal?.holeCards || [],
        winningCards: uniqueCards(highCards),
        lowWinningCards: uniqueCards(lowCards),
        usedHoleCards: used.usedHoleCards,
        usedCommunityCards: used.usedCommunityCards,
        scooped: false,
      });
      continue;
    }

    existing.totalWon += winner.share;
    if (!existing.winTypes.includes(winner.winType)) existing.winTypes.push(winner.winType);
    if (winner.handName) existing.handName = winner.handName;
    if (winner.lowHandName) existing.lowHandName = winner.lowHandName;
    if (winner.category) existing.category = winner.category;
    existing.winningCards = uniqueCards([...existing.winningCards, ...highCards]);
    existing.lowWinningCards = uniqueCards([...existing.lowWinningCards, ...lowCards]);
    if (winner.winType !== 'low') {
      existing.usedHoleCards = used.usedHoleCards.length ? used.usedHoleCards : existing.usedHoleCards;
      existing.usedCommunityCards = used.usedCommunityCards.length
        ? used.usedCommunityCards
        : existing.usedCommunityCards;
    }
  }

  const winners = Array.from(byUser.values()).map((entry) => ({
    ...entry,
    scooped:
      (entry.winTypes.includes('high') && entry.winTypes.includes('low')) ||
      entry.winTypes.includes('high-low') ||
      (showdown.highWinners.includes(entry.userId) && showdown.lowWinners.includes(entry.userId)),
  }));

  const highWinners = winners.filter(
    (entry) =>
      entry.winTypes.includes('high') ||
      entry.winTypes.includes('high-low') ||
      entry.winTypes.includes('uncontested') ||
      showdown.highWinners.includes(entry.userId)
  );
  const lowWinners = winners.filter(
    (entry) => entry.winTypes.includes('low') || entry.winTypes.includes('high-low') || showdown.lowWinners.includes(entry.userId)
  );

  const pots: WinningPotRow[] = showdown.pots.map((pot) => ({
    potId: pot.potId,
    label: pot.label,
    amount: pot.amount,
    names: pot.winners.map((winner) => winner.username).join(', '),
  }));

  const totalWon = pots.reduce((sum, pot) => sum + pot.amount, 0);
  const uncontested = awards.length > 0 && awards.every(({ winner }) => winner.winType === 'uncontested');
  const empty = awards.length === 0;
  const splitHigh = highWinners.length > 1;
  const headline = empty
    ? 'HAND COMPLETE'
    : splitHigh || winners.length > 1
      ? 'HAND WINNERS'
      : 'HAND WINNER';

  return {
    resultKey,
    empty,
    foldedWatcher,
    uncontested,
    hasLow: lowWinners.length > 0,
    splitHigh,
    headline,
    winners,
    highWinners: highWinners.length ? highWinners : winners,
    lowWinners,
    pots,
    totalWon,
  };
}

export function winningCardSet(entry: WinningHandEntry | undefined, kind: 'high' | 'low' = 'high'): Set<string> {
  if (!entry) return new Set();
  const cards = kind === 'low' ? entry.lowWinningCards : entry.winningCards.length ? entry.winningCards : entry.usedHoleCards.concat(entry.usedCommunityCards);
  return new Set(cardIds(cards));
}

export function usedCardsForHand(
  cards: PokerCard[],
  entry: WinningHandEntry,
  communityCards: PokerCard[],
  kind: 'high' | 'low'
): { usedHoleCards: PokerCard[]; usedCommunityCards: PokerCard[] } {
  if (kind === 'high' && (entry.usedHoleCards.length || entry.usedCommunityCards.length)) {
    return { usedHoleCards: entry.usedHoleCards, usedCommunityCards: entry.usedCommunityCards };
  }
  return partitionUsedCards(cards, entry.holeCards, communityCards);
}
