import { RANKS, SUITS, type MindiCard, type Rank, type Suit } from './types';

export const SUIT_CODE: Record<Suit, string> = {
  hearts: 'H',
  diamonds: 'D',
  clubs: 'C',
  spades: 'S',
};

export const RANK_CODE: Record<Rank, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': 'T',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
};

export const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const CODE_TO_SUIT: Record<string, Suit> = {
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
  S: 'spades',
};

const CODE_TO_RANK: Record<string, Rank> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  T: '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
};

export const cardId = (rank: Rank, suit: Suit): string => `${RANK_CODE[rank]}${SUIT_CODE[suit]}`;

export const createCard = (rank: Rank, suit: Suit): MindiCard => ({
  id: cardId(rank, suit),
  suit,
  rank,
  value: RANK_VALUE[rank],
});

export const parseCardId = (id: string): MindiCard => {
  if (!id || id.length !== 2) {
    throw new Error(`Invalid card id: ${id}`);
  }
  const rank = CODE_TO_RANK[id[0]];
  const suit = CODE_TO_SUIT[id[1]];
  if (!rank || !suit) {
    throw new Error(`Invalid card id: ${id}`);
  }
  return createCard(rank, suit);
};

export const createStandardDeck = (): MindiCard[] => {
  const deck: MindiCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
};

export const isTen = (card: MindiCard): boolean => card.rank === '10';

export const cloneCard = (card: MindiCard): MindiCard => ({ ...card });

export const sortHand = (cards: MindiCard[]): MindiCard[] =>
  [...cards].sort((a, b) => {
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    return a.value - b.value;
  });
