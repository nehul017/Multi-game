export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export const SUIT_CODE: Record<Suit, string> = {
  spades: 's',
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
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

export const CODE_TO_SUIT: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
};

export const CODE_TO_RANK: Record<string, Rank> = {
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

export const createCard = (rank: Rank, suit: Suit): Card => ({
  id: cardId(rank, suit),
  rank,
  suit,
});

export const parseCard = (id: string): Card => {
  if (!id || id.length < 2 || id.length > 2) {
    throw new Error(`Invalid card id: ${id}`);
  }
  const rank = CODE_TO_RANK[id[0]];
  const suit = CODE_TO_SUIT[id[1]];
  if (!rank || !suit) {
    throw new Error(`Invalid card id: ${id}`);
  }
  return createCard(rank, suit);
};

export const cardsFromIds = (ids: string[]): Card[] => ids.map(parseCard);

export const isRedSuit = (suit: Suit): boolean => suit === 'hearts' || suit === 'diamonds';

export const lowRankValue = (rank: Rank): number => (rank === 'A' ? 1 : RANK_VALUE[rank]);
