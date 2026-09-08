import type { PokerGameType, TableConfig } from './core/game-state';

export const POKER_GAME_ID = 'poker';

export const DEFAULT_ACTION_TIMEOUT_MS = 15_000;
export const HAND_PAUSE_MS = 4_000;
export const BOT_ACTION_DELAY_MS = 900;

export const POKER_VARIANTS: Record<
  PokerGameType,
  {
    id: PokerGameType;
    name: string;
    tagline: string;
    description: string;
    holeCards: number;
    communityCards: number;
    bettingRounds: string[];
    evaluation: string;
    availableActions: string[];
    potHandling: string;
  }
> = {
  'texas-holdem': {
    id: 'texas-holdem',
    name: "Texas Hold'em",
    tagline: 'The classic. Two hole cards.',
    description:
      'Each player receives two private hole cards. Five community cards are dealt across the flop, turn, and river. The best five-card hand from any combination of hole and board cards wins.',
    holeCards: 2,
    communityCards: 5,
    bettingRounds: ['Pre-Flop', 'Flop', 'Turn', 'River', 'Showdown'],
    evaluation: 'Best five cards from 2 hole + 5 community',
    availableActions: ['Fold', 'Check', 'Call', 'Bet', 'Raise', 'All-In'],
    potHandling: 'Winner takes the pot. Ties split. Side pots supported.',
  },
  omaha: {
    id: 'omaha',
    name: 'Omaha',
    tagline: 'Four hole cards. Use exactly two.',
    description:
      'Each player receives four hole cards. You must use exactly two hole cards and exactly three community cards to make a hand.',
    holeCards: 4,
    communityCards: 5,
    bettingRounds: ['Pre-Flop', 'Flop', 'Turn', 'River', 'Showdown'],
    evaluation: 'Exactly 2 hole cards + exactly 3 community cards',
    availableActions: ['Fold', 'Check', 'Call', 'Bet', 'Raise', 'All-In'],
    potHandling: 'Winner takes the pot. Ties split. Side pots supported.',
  },
  'omaha-hi-lo': {
    id: 'omaha-hi-lo',
    name: 'Omaha Hi-Lo',
    tagline: 'High plus low. Split pot.',
    description:
      'Omaha with a high hand and an 8-or-better low. Each half uses exactly two hole cards and three community cards. If no qualifying low exists, high takes the entire pot.',
    holeCards: 4,
    communityCards: 5,
    bettingRounds: ['Pre-Flop', 'Flop', 'Turn', 'River', 'High/Low Showdown'],
    evaluation: 'High: best Omaha hand. Low: A-2-3-4-5 to 8, no pairs, Ace low.',
    availableActions: ['Fold', 'Check', 'Call', 'Bet', 'Raise', 'All-In'],
    potHandling: '50% high / 50% low. Quartering when players tie a half.',
  },
  'five-card-draw': {
    id: 'five-card-draw',
    name: '5 Card Draw',
    tagline: 'Draw your cards. Classic poker.',
    description:
      'Each player is dealt five private cards. After the first betting round, players discard 0–5 cards and draw replacements. A second betting round leads to showdown. No community cards.',
    holeCards: 5,
    communityCards: 0,
    bettingRounds: ['Deal', 'Betting', 'Draw', 'Betting', 'Showdown'],
    evaluation: 'Best five-card hole hand after the draw',
    availableActions: ['Fold', 'Check', 'Call', 'Bet', 'Raise', 'All-In', 'Draw'],
    potHandling: 'Winner takes the pot. Ties split. Side pots supported.',
  },
};

export const CASH_LOBBY_TABLES: Array<{
  tableId: string;
  gameType: PokerGameType;
  name: string;
  maxSeats: number;
}> = [
  { tableId: 'poker-holdem-cash', gameType: 'texas-holdem', name: "Hold'em $5/$10", maxSeats: 6 },
  { tableId: 'poker-omaha-cash', gameType: 'omaha', name: 'Omaha $5/$10', maxSeats: 6 },
  { tableId: 'poker-hilo-cash', gameType: 'omaha-hi-lo', name: 'Hi-Lo $5/$10', maxSeats: 6 },
  { tableId: 'poker-draw-cash', gameType: 'five-card-draw', name: 'Draw $5/$10', maxSeats: 5 },
];

export const defaultTableConfig = (
  gameType: PokerGameType,
  overrides: Partial<TableConfig> = {}
): Omit<TableConfig, 'tableId'> => ({
  name: `${POKER_VARIANTS[gameType].name} Table`,
  gameType,
  maxSeats: 6,
  minSeatsToStart: 2,
  smallBlind: 5,
  bigBlind: 10,
  buyInMin: 200,
  buyInMax: 2000,
  actionTimeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
  fillBots: false,
  ...overrides,
});
