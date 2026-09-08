import { createCard, RANKS, SUITS, type Card } from './card';

export type Rng = () => number;

const defaultRng: Rng = () => Math.random();

export const createFreshDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[], rng: Rng = defaultRng): Card[] => {
  const next = deck.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
};

export const createShuffledDeck = (rng: Rng = defaultRng): Card[] => shuffleDeck(createFreshDeck(), rng);

export const dealCards = (deck: Card[], count: number): { cards: Card[]; deck: Card[] } => {
  if (count < 0) {
    throw new Error('Cannot deal a negative number of cards');
  }
  if (count > deck.length) {
    throw new Error('Not enough cards remaining in the deck');
  }
  return {
    cards: deck.slice(0, count),
    deck: deck.slice(count),
  };
};

export const assertUniqueDeck = (deck: Card[]): void => {
  if (deck.length !== 52) {
    throw new Error(`Deck must contain 52 cards, got ${deck.length}`);
  }
  const ids = new Set(deck.map((card) => card.id));
  if (ids.size !== 52) {
    throw new Error('Deck contains duplicate cards');
  }
};
