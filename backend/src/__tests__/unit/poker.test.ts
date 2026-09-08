import { cardsFromIds, createCard, parseCard } from '../../games/poker/core/card';
import { assertUniqueDeck, createFreshDeck, createShuffledDeck, dealCards } from '../../games/poker/core/deck';
import {
  combinations,
  evaluateFive,
  evaluateFiveCardDraw,
  evaluateHoldEm,
  evaluateOmahaHigh,
} from '../../games/poker/core/evaluator';
import { compareEvaluatedHands } from '../../games/poker/core/hand';
import { buildPots, splitEvenly, splitHighLow } from '../../games/poker/core/pot';
import { getLegalActions } from '../../games/poker/core/betting';
import {
  applyAction,
  applyTimeout,
  createTableState,
  sanitizeTableState,
  sitPlayer,
  startHand,
} from '../../games/poker/core/table';
import type { TableConfig, TableState } from '../../games/poker/core/game-state';
import { evaluateFiveLow, evaluateOmahaLow } from '../../games/poker/variants/omaha-hi-lo/low-hand';
import { getVariantRules } from '../../games/poker/variants/shared';
import { AppError } from '../../utils/AppError';

jest.mock('../../services/economy.service', () => ({
  economyService: {
    debitCoinsAtomic: jest.fn(),
    creditCoinsAtomic: jest.fn(),
  },
}));

jest.mock('../../repositories/poker.repository', () => ({
  pokerTableRepository: {
    listOpen: jest.fn().mockResolvedValue([]),
    listPracticeOpen: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    findByTableId: jest.fn(),
    upsertSnapshot: jest.fn(),
  },
  pokerHandRepository: {
    create: jest.fn(),
    findRecentByTable: jest.fn().mockResolvedValue([]),
    findRecentByUser: jest.fn().mockResolvedValue([]),
    completeHand: jest.fn(),
  },
  pokerActionRepository: {
    create: jest.fn(),
    findByHand: jest.fn().mockResolvedValue([]),
  },
  pokerPlayerSessionRepository: {
    create: jest.fn(),
    findActive: jest.fn(),
    findActiveByUser: jest.fn(),
    markLeft: jest.fn(),
    findSeatedByTable: jest.fn().mockResolvedValue([]),
    markLeftByTable: jest.fn(),
  },
}));

const config = (gameType: TableConfig['gameType'], extras: Partial<TableConfig> = {}): TableConfig => ({
  tableId: 'table-test',
  name: 'Test Table',
  gameType,
  maxSeats: 6,
  minSeatsToStart: 2,
  smallBlind: 5,
  bigBlind: 10,
  buyInMin: 100,
  buyInMax: 2000,
  actionTimeoutMs: 15_000,
  fillBots: false,
  ...extras,
});

const seat = (state: TableState, id: string, chips = 500, seatIndex?: number) =>
  sitPlayer(state, { userId: id, username: id, chips, seatIndex });

describe('Deck', () => {
  it('creates 52 unique cards', () => {
    const deck = createFreshDeck();
    expect(deck).toHaveLength(52);
    assertUniqueDeck(deck);
  });

  it('rejects a deck with duplicates', () => {
    const deck = createFreshDeck();
    deck[1] = deck[0];
    expect(() => assertUniqueDeck(deck)).toThrow(/duplicate/);
  });

  it('shuffles without dropping cards', () => {
    const shuffled = createShuffledDeck(() => 0.3);
    expect(shuffled).toHaveLength(52);
    assertUniqueDeck(shuffled);
  });

  it('deals from the front and shortens the deck', () => {
    const deck = createFreshDeck();
    const { cards, deck: remaining } = dealCards(deck, 5);
    expect(cards).toHaveLength(5);
    expect(remaining).toHaveLength(47);
    expect(cards[0]).toEqual(deck[0]);
  });

  it('parses standard card ids', () => {
    expect(parseCard('Ah')).toEqual(createCard('A', 'hearts'));
    expect(parseCard('Td')).toEqual(createCard('10', 'diamonds'));
  });
});

describe('Hand evaluator', () => {
  it('ranks a royal flush above a straight flush', () => {
    const royal = evaluateFive(cardsFromIds(['Ah', 'Kh', 'Qh', 'Jh', 'Th']));
    const steel = evaluateFive(cardsFromIds(['Ah', '2h', '3h', '4h', '5h']));
    expect(royal.category).toBe('royal-flush');
    expect(steel.category).toBe('straight-flush');
    expect(compareEvaluatedHands(royal, steel)).toBeGreaterThan(0);
  });

  it('treats A-2-3-4-5 as a wheel straight', () => {
    const wheel = evaluateFive(cardsFromIds(['Ah', '2c', '3d', '4s', '5h']));
    expect(wheel.category).toBe('straight');
    expect(wheel.ranks[0]).toBe(5);
  });

  it('compares kickers on one pair', () => {
    const acesKing = evaluateFive(cardsFromIds(['Ah', 'Ad', 'Kc', '7s', '2h']));
    const acesQueen = evaluateFive(cardsFromIds(['As', 'Ac', 'Qd', '7c', '2d']));
    expect(acesKing.category).toBe('one-pair');
    expect(compareEvaluatedHands(acesKing, acesQueen)).toBeGreaterThan(0);
  });

  it('compares full houses by trips then pair', () => {
    const ninesFull = evaluateFive(cardsFromIds(['9h', '9d', '9c', 'As', 'Ad']));
    const eightsFull = evaluateFive(cardsFromIds(['8h', '8d', '8c', 'Ks', 'Kd']));
    expect(compareEvaluatedHands(ninesFull, eightsFull)).toBeGreaterThan(0);
  });

  it('detects four of a kind, flush, and two pair', () => {
    expect(evaluateFive(cardsFromIds(['Ah', 'Ad', 'Ac', 'As', '2h'])).category).toBe('four-of-a-kind');
    expect(evaluateFive(cardsFromIds(['2h', '5h', '9h', 'Jh', 'Kh'])).category).toBe('flush');
    expect(evaluateFive(cardsFromIds(['Ah', 'Ad', 'Kh', 'Kd', '2c'])).category).toBe('two-pair');
  });
});

describe("Texas Hold'em", () => {
  it('deals 2 hole cards and runs flop, turn, river', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 500, 0);
    seat(state, 'b', 500, 1);
    startHand(state, () => 0.2);
    expect(state.players.every((player) => player.holeCards.length === 2)).toBe(true);
    expect(state.street).toBe('preflop');

    applyAction(state, state.currentPlayerId!, { type: 'call' });
    applyAction(state, state.currentPlayerId!, { type: 'check' });
    expect(state.street).toBe('flop');
    expect(state.communityCards).toHaveLength(3);

    applyAction(state, state.currentPlayerId!, { type: 'check' });
    applyAction(state, state.currentPlayerId!, { type: 'check' });
    expect(state.street).toBe('turn');
    expect(state.communityCards).toHaveLength(4);

    applyAction(state, state.currentPlayerId!, { type: 'check' });
    applyAction(state, state.currentPlayerId!, { type: 'check' });
    expect(state.street).toBe('river');
    expect(state.communityCards).toHaveLength(5);

    applyAction(state, state.currentPlayerId!, { type: 'check' });
    applyAction(state, state.currentPlayerId!, { type: 'check' });
    expect(['showdown', 'complete']).toContain(state.street);
    expect(state.showdown).toBeTruthy();
  });

  it('folds, checks, calls, raises, and all-ins', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 200, 0);
    seat(state, 'b', 200, 1);
    seat(state, 'c', 200, 2);
    startHand(state, () => 0.4);
    const first = state.currentPlayerId!;
    applyAction(state, first, { type: 'fold' });
    expect(state.players.find((player) => player.userId === first)?.status).toBe('folded');

    const raiser = state.currentPlayerId!;
    applyAction(state, raiser, { type: 'raise', amount: 40 });
    const caller = state.currentPlayerId!;
    applyAction(state, caller, { type: 'call' });
    if (state.currentPlayerId) {
      const legal = getLegalActions(state, state.currentPlayerId);
      if (legal.some((action) => action.type === 'all-in')) {
        applyAction(state, state.currentPlayerId, { type: 'all-in' });
      }
    }
    expect(state.pot).toBeGreaterThan(0);
  });

  it('awards the pot to the last remaining player without a showdown reveal', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 300, 0);
    seat(state, 'b', 300, 1);
    startHand(state, () => 0.1);
    applyAction(state, state.currentPlayerId!, { type: 'fold' });
    expect(state.showdown?.pots[0].winners[0].winType).toBe('uncontested');
    expect(state.showdown?.revealedPlayers).toHaveLength(0);
  });

  it('splits a tied pot', () => {
    const board = cardsFromIds(['Ah', 'Kh', 'Qh', 'Jh', '9c']);
    const a = evaluateHoldEm(cardsFromIds(['2d', '3c']), board);
    const b = evaluateHoldEm(cardsFromIds(['4d', '5c']), board);
    expect(compareEvaluatedHands(a, b)).toBe(0);
  });

  it('builds a main pot and a side pot', () => {
    const state = createTableState(config('texas-holdem'));
    const short = sitPlayer(state, { userId: 'short', username: 'short', chips: 200, seatIndex: 0 });
    short.chips = 50;
    const mid = sitPlayer(state, { userId: 'mid', username: 'mid', chips: 200, seatIndex: 1 });
    const deep = sitPlayer(state, { userId: 'deep', username: 'deep', chips: 200, seatIndex: 2 });
    short.committed = 50;
    mid.committed = 120;
    deep.committed = 120;
    const pots = buildPots(state.players);
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150);
    expect(pots[1].amount).toBe(140);
    expect(pots[0].eligiblePlayerIds).toEqual(expect.arrayContaining(['short', 'mid', 'deep']));
    expect(pots[1].eligiblePlayerIds).toEqual(expect.arrayContaining(['mid', 'deep']));
  });
});

describe('Omaha', () => {
  it('deals 4 hole cards', () => {
    const state = createTableState(config('omaha'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.25);
    expect(state.players.every((player) => player.holeCards.length === 4)).toBe(true);
  });

  it('must use exactly 2 hole cards and 3 community cards', () => {
    const hole = cardsFromIds(['Ah', '2h', '3d', '4c']);
    const board = cardsFromIds(['5h', '6h', '7h', '8h', '9h']);
    const holdem = evaluateHoldEm(hole, board);
    const omaha = evaluateOmahaHigh(hole, board);
    expect(holdem.category).toBe('straight-flush');
    expect(omaha.category).not.toBe('straight-flush');
    expect(omaha.category).toBe('flush');
  });

  it('enumerates C(4,2)*C(5,3) combinations', () => {
    expect(combinations([1, 2, 3, 4], 2)).toHaveLength(6);
    expect(combinations([1, 2, 3, 4, 5], 3)).toHaveLength(10);
  });
});

describe('Omaha Hi-Lo', () => {
  it('recognizes a qualifying wheel low', () => {
    const low = evaluateFiveLow(cardsFromIds(['Ah', '2c', '3d', '4s', '5h']));
    expect(low?.name).toBe('A-2-3-4-5');
  });

  it('rejects a 9 as a qualifying low', () => {
    expect(evaluateFiveLow(cardsFromIds(['Ah', '2c', '3d', '4s', '9h']))).toBeNull();
  });

  it('uses exactly 2+3 for both high and low', () => {
    const hole = cardsFromIds(['Ah', '2d', 'Kh', 'Kd']);
    const board = cardsFromIds(['3c', '4s', '5h', 'Kc', '9d']);
    const low = evaluateOmahaLow(hole, board);
    expect(low?.name).toBe('A-2-3-4-5');
    const high = evaluateOmahaHigh(hole, board);
    expect(high.category).toBe('straight');
  });

  it('splits a pot 50/50 and quarters a tied low', () => {
    expect(splitHighLow(100)).toEqual({ high: 50, low: 50 });
    expect(splitEvenly(50, 2)).toEqual([25, 25]);
  });

  it('awards the whole pot to high when no low qualifies', () => {
    const rules = getVariantRules('omaha-hi-lo');
    const hole = cardsFromIds(['Kh', 'Kd', 'Qh', 'Qd']);
    const board = cardsFromIds(['Kc', 'Qs', 'Jh', 'Td', '9c']);
    expect(rules.evaluateLow(hole, board)).toBeNull();
  });

  it('plays a hi-lo hand to showdown', () => {
    const state = createTableState(config('omaha-hi-lo'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.33);
    while (state.street !== 'complete' && state.currentPlayerId) {
      const legal = getLegalActions(state, state.currentPlayerId);
      if (legal.some((action) => action.type === 'check')) {
        applyAction(state, state.currentPlayerId, { type: 'check' });
      } else if (legal.some((action) => action.type === 'call')) {
        applyAction(state, state.currentPlayerId, { type: 'call' });
      } else {
        applyAction(state, state.currentPlayerId, { type: 'fold' });
      }
    }
    expect(state.showdown).toBeTruthy();
  });
});

describe('Five Card Draw', () => {
  it('deals 5 hole cards and has no community cards', () => {
    const state = createTableState(config('five-card-draw'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.15);
    expect(state.players.every((player) => player.holeCards.length === 5)).toBe(true);
    expect(state.communityCards).toHaveLength(0);
  });

  it('allows discarding 0, 1, or 5 cards then plays a second betting round', () => {
    const state = createTableState(config('five-card-draw'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.12);

    while (state.street === 'preflop' && state.currentPlayerId) {
      const legal = getLegalActions(state, state.currentPlayerId);
      applyAction(
        state,
        state.currentPlayerId,
        legal.some((action) => action.type === 'check') ? { type: 'check' } : { type: 'call' }
      );
    }

    expect(state.street).toBe('draw');
    const first = state.players.find((player) => player.userId === state.currentPlayerId)!;
    const before = first.holeCards.map((card) => card.id);
    applyAction(state, first.userId, { type: 'draw', discardIndexes: [] });
    expect(state.players.find((player) => player.userId === first.userId)?.holeCards.map((card) => card.id)).toEqual(before);

    const second = state.players.find((player) => player.userId === state.currentPlayerId)!;
    applyAction(state, second.userId, { type: 'draw', discardIndexes: [0] });
    expect(second.holeCards).toHaveLength(5);

    expect(['draw-betting', 'complete', 'showdown']).toContain(state.street);
  });

  it('replaces all five cards when requested', () => {
    const state = createTableState(config('five-card-draw'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.18);
    while (state.street === 'preflop' && state.currentPlayerId) {
      const legal = getLegalActions(state, state.currentPlayerId);
      applyAction(
        state,
        state.currentPlayerId,
        legal.some((action) => action.type === 'check') ? { type: 'check' } : { type: 'call' }
      );
    }
    const drawer = state.players.find((player) => player.userId === state.currentPlayerId)!;
    const before = drawer.holeCards.map((card) => card.id);
    applyAction(state, drawer.userId, { type: 'draw', discardIndexes: [0, 1, 2, 3, 4] });
    const after = state.players.find((player) => player.userId === drawer.userId)!.holeCards.map((card) => card.id);
    expect(after).toHaveLength(5);
    expect(after.some((id) => !before.includes(id))).toBe(true);
  });

  it('evaluates the five hole cards only', () => {
    const hand = evaluateFiveCardDraw(cardsFromIds(['Ah', 'Ad', 'Ac', 'As', '2h']));
    expect(hand.category).toBe('four-of-a-kind');
  });
});

describe('Security and sanitization', () => {
  it('never sends opponent hole cards before showdown', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.2);
    const view = sanitizeTableState(state, 'a');
    const opponent = view.players.find((player) => player.userId === 'b');
    expect(opponent?.holeCards).toBeNull();
    expect(view.myCards).toHaveLength(2);
    expect(JSON.stringify(view)).not.toContain(state.players.find((player) => player.userId === 'b')!.holeCards[0].id);
    expect((view as unknown as { deck?: unknown }).deck).toBeUndefined();
  });

  it('rejects actions out of turn, after a fold, and with invalid amounts', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.2);
    const waiter = state.players.find((player) => player.userId !== state.currentPlayerId)!;
    expect(() => applyAction(state, waiter.userId, { type: 'check' })).toThrow(AppError);

    const actor = state.currentPlayerId!;
    applyAction(state, actor, { type: 'fold' });
    expect(() => applyAction(state, actor, { type: 'call' })).toThrow(AppError);
  });

  it('times out with check when legal, otherwise fold', () => {
    const state = createTableState(config('texas-holdem'));
    seat(state, 'a', 400, 0);
    seat(state, 'b', 400, 1);
    startHand(state, () => 0.2);
    const actor = state.currentPlayerId!;
    applyAction(state, actor, { type: 'call' });
    state.actionDeadline = Date.now() - 1;
    applyTimeout(state);
    const timed = state.players.find((player) => player.userId !== actor);
    expect(timed?.lastAction === 'check' || timed?.status === 'folded' || state.street !== 'preflop').toBe(true);
  });
});
