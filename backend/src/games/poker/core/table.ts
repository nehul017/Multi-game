import { randomUUID } from 'crypto';
import { AppError } from '../../../utils/AppError';
import type { Card } from './card';
import { createShuffledDeck, dealCards, type Rng } from './deck';
import { compareEvaluatedHands } from './evaluator';
import {
  getLegalActions,
  applyBettingAction,
  bettingRoundComplete,
  onlyOneContested,
  timeoutActionFor,
} from './betting';
import type {
  AllowedAction,
  PokerActionInput,
  PotAward,
  PublicTableState,
  RevealedPlayer,
  ShowdownResult,
  TableConfig,
  TableState,
} from './game-state';
import { createSeatPlayer, livePlayers, resetPlayerForHand, seatedPlayers, type SeatPlayer } from './player';
import { buildPots, splitEvenly, splitHighLow, totalPot } from './pot';
import { getVariantRules } from '../variants/shared';
import { compareLowHands } from '../variants/omaha-hi-lo/low-hand';

const nextOccupiedSeat = (
  players: SeatPlayer[],
  fromSeat: number,
  predicate?: (player: SeatPlayer) => boolean
): SeatPlayer | null => {
  const seated = [...players]
    .filter((player) => !predicate || predicate(player))
    .sort((a, b) => a.seatIndex - b.seatIndex);
  if (seated.length === 0) return null;
  return seated.find((player) => player.seatIndex > fromSeat) || seated[0];
};

const playersInSeatOrder = (players: SeatPlayer[]): SeatPlayer[] =>
  [...players].sort((a, b) => a.seatIndex - b.seatIndex);

const nextActiveFrom = (state: TableState, fromSeat: number): SeatPlayer | null => {
  const ordered = playersInSeatOrder(state.players);
  const start = ordered.findIndex((player) => player.seatIndex === fromSeat);
  const rotation = start >= 0
    ? [...ordered.slice(start + 1), ...ordered.slice(0, start + 1)]
    : ordered;
  return rotation.find((player) => player.status === 'active' && player.chips > 0) || null;
};

const nextDrawerFrom = (state: TableState, fromSeat: number): SeatPlayer | null => {
  const ordered = playersInSeatOrder(state.players);
  const start = ordered.findIndex((player) => player.seatIndex === fromSeat);
  const rotation = start >= 0
    ? [...ordered.slice(start + 1), ...ordered.slice(0, start + 1)]
    : ordered;
  return rotation.find((player) => player.status === 'active' && !player.hasDrawn) || null;
};

export const createTableState = (config: TableConfig): TableState => ({
  tableId: config.tableId,
  config,
  phase: 'waiting',
  street: 'waiting',
  handId: null,
  handNumber: 0,
  players: [],
  communityCards: [],
  deck: [],
  pot: 0,
  sidePots: [],
  currentPlayerId: null,
  dealerPosition: 0,
  smallBlindPosition: 0,
  bigBlindPosition: 0,
  currentBet: 0,
  minimumRaise: config.bigBlind,
  lastRaiseSize: config.bigBlind,
  lastFullRaise: false,
  actionDeadline: null,
  lastAggressorId: null,
  showdown: null,
  handStartedAt: null,
  botFillAt: null,
  createdAt: Date.now(),
  status: 'open',
});

export const sitPlayer = (
  state: TableState,
  input: { userId: string; username: string; avatar?: string; seatIndex?: number; chips: number; isBot?: boolean }
): SeatPlayer => {
  if (state.players.some((player) => player.userId === input.userId)) {
    throw new AppError('Already seated at this table', 409);
  }
  if (input.chips < state.config.buyInMin || input.chips > state.config.buyInMax) {
    throw new AppError(`Buy-in must be between ${state.config.buyInMin} and ${state.config.buyInMax}`, 400);
  }

  const taken = new Set(state.players.map((player) => player.seatIndex));
  let seat = input.seatIndex;
  if (seat == null) {
    seat = Array.from({ length: state.config.maxSeats }, (_, index) => index).find((index) => !taken.has(index));
  }
  if (seat == null || seat < 0 || seat >= state.config.maxSeats || taken.has(seat)) {
    throw new AppError('Seat is not available', 409);
  }

  const player = createSeatPlayer({
    userId: input.userId,
    username: input.username,
    avatar: input.avatar,
    seatIndex: seat,
    chips: input.chips,
    isBot: input.isBot,
  });
  state.players.push(player);
  state.players.sort((a, b) => a.seatIndex - b.seatIndex);
  return player;
};

export const removePlayer = (state: TableState, userId: string): SeatPlayer | null => {
  const index = state.players.findIndex((player) => player.userId === userId);
  if (index < 0) return null;
  const [player] = state.players.splice(index, 1);
  if (state.currentPlayerId === userId) state.currentPlayerId = null;
  return player;
};

const postBlind = (state: TableState, player: SeatPlayer, amount: number): void => {
  const paid = Math.min(player.chips, amount);
  player.chips -= paid;
  player.betThisStreet += paid;
  player.committed += paid;
  state.pot += paid;
  if (player.chips === 0) player.status = 'all-in';
};

const resetStreetBets = (state: TableState): void => {
  for (const player of state.players) {
    player.betThisStreet = 0;
    player.hasActedThisStreet = player.status !== 'active';
    if (player.status === 'active') player.lastAction = undefined;
  }
  state.currentBet = 0;
  state.minimumRaise = state.config.bigBlind;
  state.lastRaiseSize = state.config.bigBlind;
  state.lastAggressorId = null;
};

const dealToPlayers = (state: TableState, count: number): void => {
  const recipients = state.players.filter((player) => player.status === 'active' || player.status === 'all-in');
  for (let i = 0; i < count; i += 1) {
    for (const player of playersInSeatOrder(recipients)) {
      const dealt = dealCards(state.deck, 1);
      state.deck = dealt.deck;
      player.holeCards.push(...dealt.cards);
    }
  }
};

const dealCommunity = (state: TableState, count: number): void => {
  const dealt = dealCards(state.deck, count);
  state.deck = dealt.deck;
  state.communityCards.push(...dealt.cards);
};

const setTurn = (state: TableState, player: SeatPlayer | null): void => {
  state.currentPlayerId = player?.userId || null;
  state.actionDeadline = player ? Date.now() + state.config.actionTimeoutMs : null;
};

const firstToActPostflop = (state: TableState): SeatPlayer | null =>
  nextActiveFrom(state, state.dealerPosition);

const firstToActPreflop = (state: TableState): SeatPlayer | null => {
  const live = seatedPlayers(state.players);
  if (live.length === 2) {
    return state.players.find((player) => player.seatIndex === state.dealerPosition && player.status === 'active')
      || nextActiveFrom(state, state.bigBlindPosition);
  }
  return nextActiveFrom(state, state.bigBlindPosition);
};

export const canStartHand = (state: TableState): boolean => {
  if (state.street !== 'waiting' && state.street !== 'complete') return false;
  return seatedPlayers(state.players).length >= state.config.minSeatsToStart;
};

export const startHand = (state: TableState, rng?: Rng): TableState => {
  const eligible = seatedPlayers(state.players);
  if (eligible.length < state.config.minSeatsToStart) {
    throw new AppError('Not enough players to start a hand', 400);
  }

  const rules = getVariantRules(state.config.gameType);
  state.handId = randomUUID();
  state.handNumber += 1;
  state.handStartedAt = Date.now();
  state.showdown = null;
  state.communityCards = [];
  state.pot = 0;
  state.sidePots = [];
  state.status = 'playing';

  for (const player of state.players) {
    resetPlayerForHand(player);
  }

  const seated = seatedPlayers(state.players);
  const previousDealer = state.dealerPosition;
  const nextDealer = nextOccupiedSeat(seated, state.handNumber === 1 ? previousDealer - 1 : previousDealer);
  if (!nextDealer) throw new AppError('Unable to assign dealer', 500);
  state.dealerPosition = nextDealer.seatIndex;
  nextDealer.isDealer = true;

  const sb = seated.length === 2
    ? nextDealer
    : nextOccupiedSeat(seated, state.dealerPosition);
  const bb = seated.length === 2
    ? nextOccupiedSeat(seated, state.dealerPosition)
    : nextOccupiedSeat(seated, sb!.seatIndex);
  if (!sb || !bb) throw new AppError('Unable to post blinds', 500);

  state.smallBlindPosition = sb.seatIndex;
  state.bigBlindPosition = bb.seatIndex;
  sb.isSmallBlind = true;
  bb.isBigBlind = true;
  postBlind(state, sb, state.config.smallBlind);
  postBlind(state, bb, state.config.bigBlind);

  state.deck = createShuffledDeck(rng);
  dealToPlayers(state, rules.holeCardCount);

  state.currentBet = Math.max(...state.players.map((player) => player.betThisStreet), 0);
  state.minimumRaise = state.config.bigBlind;
  state.lastRaiseSize = state.config.bigBlind;
  state.street = 'preflop';
  state.phase = 'preflop';
  setTurn(state, firstToActPreflop(state));
  refreshPots(state);
  return state;
};

const refreshPots = (state: TableState): void => {
  state.sidePots = buildPots(state.players);
  state.pot = totalPot(state.sidePots);
};

const awardUncontested = (state: TableState): void => {
  const winner = livePlayers(state.players)[0];
  if (!winner) return;
  winner.chips += state.pot;
  winner.status = 'winner';
  state.showdown = {
    pots: [
      {
        potId: 'pot-0',
        label: 'MAIN POT',
        amount: state.pot,
        winners: [
          {
            userId: winner.userId,
            username: winner.username,
            share: state.pot,
            winType: 'uncontested',
          },
        ],
      },
    ],
    revealedPlayers: [],
    highWinners: [winner.userId],
    lowWinners: [],
  };
  state.pot = 0;
  state.sidePots = [];
  finishHand(state);
};

const finishHand = (state: TableState): void => {
  state.street = 'complete';
  state.phase = 'payout';
  state.currentPlayerId = null;
  state.actionDeadline = null;
  state.deck = [];
  for (const player of state.players) {
    if (player.chips <= 0) player.status = player.status === 'winner' ? 'winner' : 'waiting';
  }
};

const resolveShowdown = (state: TableState): void => {
  const rules = getVariantRules(state.config.gameType);
  const pots = buildPots(state.players);
  const awards: PotAward[] = [];
  const revealed: RevealedPlayer[] = [];
  const highWinnerIds = new Set<string>();
  const lowWinnerIds = new Set<string>();

  const contestants = (ids: string[]) =>
    state.players.filter((player) => ids.includes(player.userId) && player.status !== 'folded');

  for (const player of livePlayers(state.players)) {
    player.revealed = true;
    const high = rules.evaluateHigh(player.holeCards, state.communityCards);
    const low = rules.splitPot ? rules.evaluateLow(player.holeCards, state.communityCards) : null;
    revealed.push({
      userId: player.userId,
      username: player.username,
      holeCards: player.holeCards,
      handName: high.name,
      lowHandName: low?.name,
      category: high.category,
      highHand: high,
    });
  }

  for (const pot of pots) {
    const players = contestants(pot.eligiblePlayerIds);
    if (players.length === 0) continue;

    const highs = players.map((player) => ({
      player,
      hand: rules.evaluateHigh(player.holeCards, state.communityCards),
    }));
    highs.sort((a, b) => compareEvaluatedHands(b.hand, a.hand));
    const bestHigh = highs[0].hand;
    const highWinners = highs.filter((item) => compareEvaluatedHands(item.hand, bestHigh) === 0);

    if (!rules.splitPot) {
      const shares = splitEvenly(pot.amount, highWinners.length);
      const winners = highWinners.map((item, index) => {
        item.player.chips += shares[index];
        item.player.status = 'winner';
        highWinnerIds.add(item.player.userId);
        return {
          userId: item.player.userId,
          username: item.player.username,
          share: shares[index],
          winType: 'high' as const,
          handName: item.hand.name,
          category: item.hand.category,
        };
      });
      awards.push({ potId: pot.id, label: pot.label, amount: pot.amount, winners });
      continue;
    }

    const lows = players
      .map((player) => ({
        player,
        hand: rules.evaluateLow(player.holeCards, state.communityCards),
      }))
      .filter((item): item is { player: SeatPlayer; hand: NonNullable<ReturnType<typeof rules.evaluateLow>> } => Boolean(item.hand));

    if (lows.length === 0) {
      const shares = splitEvenly(pot.amount, highWinners.length);
      const winners = highWinners.map((item, index) => {
        item.player.chips += shares[index];
        item.player.status = 'winner';
        highWinnerIds.add(item.player.userId);
        return {
          userId: item.player.userId,
          username: item.player.username,
          share: shares[index],
          winType: 'high' as const,
          handName: item.hand.name,
          category: item.hand.category,
        };
      });
      awards.push({ potId: pot.id, label: pot.label, amount: pot.amount, winners });
      continue;
    }

    lows.sort((a, b) => compareLowHands(b.hand, a.hand));
    const bestLow = lows[0].hand;
    const lowWinners = lows.filter((item) => compareLowHands(item.hand, bestLow) === 0);
    const { high, low } = splitHighLow(pot.amount);
    const highShares = splitEvenly(high, highWinners.length);
    const lowShares = splitEvenly(low, lowWinners.length);
    const winners = [
      ...highWinners.map((item, index) => {
        item.player.chips += highShares[index];
        item.player.status = 'winner';
        highWinnerIds.add(item.player.userId);
        return {
          userId: item.player.userId,
          username: item.player.username,
          share: highShares[index],
          winType: 'high' as const,
          handName: item.hand.name,
          category: item.hand.category,
        };
      }),
      ...lowWinners.map((item, index) => {
        item.player.chips += lowShares[index];
        item.player.status = 'winner';
        lowWinnerIds.add(item.player.userId);
        return {
          userId: item.player.userId,
          username: item.player.username,
          share: lowShares[index],
          winType: 'low' as const,
          lowHandName: item.hand.name,
        };
      }),
    ];
    awards.push({ potId: pot.id, label: pot.label, amount: pot.amount, winners });
  }

  state.showdown = {
    pots: awards,
    revealedPlayers: revealed,
    highWinners: [...highWinnerIds],
    lowWinners: [...lowWinnerIds],
  };
  state.pot = 0;
  state.sidePots = pots;
  state.street = 'showdown';
  state.phase = 'showdown';
  state.currentPlayerId = null;
  state.actionDeadline = null;
};

const runOutBoard = (state: TableState): void => {
  const rules = getVariantRules(state.config.gameType);
  const needed = rules.communityCardCount - state.communityCards.length;
  if (needed > 0) dealCommunity(state, needed);
};

const advanceStreet = (state: TableState): void => {
  const rules = getVariantRules(state.config.gameType);
  refreshPots(state);

  if (onlyOneContested(state)) {
    awardUncontested(state);
    return;
  }

  if (actionablePlayersLeft(state) === 0) {
    if (rules.hasDrawPhase && state.street === 'preflop') {
      applyDrawReplacements(state, new Map());
    }
    runOutBoard(state);
    resolveShowdown(state);
    finishHand(state);
    return;
  }

  if (rules.hasDrawPhase) {
    if (state.street === 'preflop') {
      beginDrawPhase(state);
      return;
    }
    if (state.street === 'draw-betting') {
      resolveShowdown(state);
      finishHand(state);
      return;
    }
  }

  if (state.street === 'preflop') {
    dealCommunity(state, rules.communityDeal.flop || 0);
    state.street = 'flop';
    state.phase = 'flop';
  } else if (state.street === 'flop') {
    dealCommunity(state, rules.communityDeal.turn || 0);
    state.street = 'turn';
    state.phase = 'turn';
  } else if (state.street === 'turn') {
    dealCommunity(state, rules.communityDeal.river || 0);
    state.street = 'river';
    state.phase = 'river';
  } else if (state.street === 'river') {
    resolveShowdown(state);
    finishHand(state);
    return;
  }

  resetStreetBets(state);
  refreshPots(state);
  setTurn(state, firstToActPostflop(state));
  if (!state.currentPlayerId) {
    resolveShowdown(state);
    finishHand(state);
  }
};

const actionablePlayersLeft = (state: TableState): number =>
  state.players.filter((player) => player.status === 'active' && player.chips > 0).length;

const beginDrawPhase = (state: TableState): void => {
  state.street = 'draw';
  state.phase = 'draw';
  for (const player of state.players) {
    player.hasDrawn = player.status !== 'active';
  }
  const first = nextDrawerFrom(state, state.dealerPosition);
  setTurn(state, first);
  if (!first) {
    beginDrawBetting(state);
  }
};

const applyDrawReplacements = (state: TableState, discards: Map<string, number[]>): void => {
  for (const player of state.players) {
    if (player.status === 'folded') continue;
    const indexes = [...new Set(discards.get(player.userId) || [])].sort((a, b) => b - a);
    for (const index of indexes) {
      if (index < 0 || index >= player.holeCards.length) continue;
      player.holeCards.splice(index, 1);
    }
    if (indexes.length > 0) {
      const dealt = dealCards(state.deck, indexes.length);
      state.deck = dealt.deck;
      player.holeCards.push(...dealt.cards);
    }
    player.hasDrawn = true;
  }
};

const beginDrawBetting = (state: TableState): void => {
  state.street = 'draw-betting';
  state.phase = 'draw-betting';
  resetStreetBets(state);
  refreshPots(state);
  setTurn(state, firstToActPostflop(state));
  if (!state.currentPlayerId) {
    resolveShowdown(state);
    finishHand(state);
  }
};

const applyDraw = (state: TableState, player: SeatPlayer, discardIndexes: number[] = []): void => {
  const unique = [...new Set(discardIndexes.map((index) => Math.floor(index)))];
  if (unique.some((index) => index < 0 || index >= player.holeCards.length)) {
    throw new AppError('Invalid discard indexes', 400);
  }
  if (unique.length > player.holeCards.length) {
    throw new AppError('Cannot discard more cards than you hold', 400);
  }

  unique.sort((a, b) => b - a);
  for (const index of unique) {
    player.holeCards.splice(index, 1);
  }
  if (unique.length > 0) {
    const dealt = dealCards(state.deck, unique.length);
    state.deck = dealt.deck;
    player.holeCards.push(...dealt.cards);
  }
  player.hasDrawn = true;
  player.lastAction = 'draw';

  const next = nextDrawerFrom(state, player.seatIndex);
  if (next) {
    setTurn(state, next);
    return;
  }
  beginDrawBetting(state);
};

const advanceTurn = (state: TableState, from: SeatPlayer): void => {
  if (onlyOneContested(state)) {
    refreshPots(state);
    awardUncontested(state);
    return;
  }
  if (bettingRoundComplete(state)) {
    advanceStreet(state);
    return;
  }
  const next = nextActiveFrom(state, from.seatIndex);
  if (!next || next.userId === from.userId) {
    advanceStreet(state);
    return;
  }
  setTurn(state, next);
};

export const applyAction = (state: TableState, userId: string, action: PokerActionInput): TableState => {
  if (state.street === 'waiting' || state.street === 'complete' || state.street === 'showdown') {
    throw new AppError('No active betting round', 400);
  }
  if (state.currentPlayerId !== userId) {
    throw new AppError('It is not your turn', 400);
  }

  const player = state.players.find((item) => item.userId === userId);
  if (!player) throw new AppError('You are not seated at this table', 403);
  if (player.status === 'folded') throw new AppError('Folded players cannot act', 400);
  if (player.status === 'all-in' && action.type !== 'draw') {
    throw new AppError('All-in players cannot act', 400);
  }

  if (state.street === 'draw') {
    if (action.type !== 'draw') throw new AppError('Draw action required', 400);
    applyDraw(state, player, action.discardIndexes || []);
    refreshPots(state);
    return state;
  }

  const legal = getLegalActions(state, userId);
  if (!legal.some((item) => item.type === action.type)) {
    throw new AppError('Illegal action', 400);
  }

  const result = applyBettingAction(state, player, action);
  state.pot += result.potDelta;
  refreshPots(state);
  advanceTurn(state, player);
  return state;
};

export const applyTimeout = (state: TableState): TableState => {
  if (!state.currentPlayerId || !state.actionDeadline) return state;
  if (Date.now() < state.actionDeadline) return state;
  return applyAction(state, state.currentPlayerId, timeoutActionFor(state, state.currentPlayerId));
};

export const prepareNextHand = (state: TableState): void => {
  state.street = 'waiting';
  state.phase = 'waiting';
  state.handId = null;
  state.communityCards = [];
  state.deck = [];
  state.pot = 0;
  state.sidePots = [];
  state.currentPlayerId = null;
  state.actionDeadline = null;
  state.showdown = null;
  state.status = 'open';
  for (const player of state.players) {
    player.holeCards = [];
    player.betThisStreet = 0;
    player.committed = 0;
    player.revealed = false;
    player.lastAction = undefined;
    player.isDealer = false;
    player.isSmallBlind = false;
    player.isBigBlind = false;
    player.status = player.chips > 0 ? 'waiting' : 'waiting';
  }
};

export const sanitizeTableState = (state: TableState, viewerId?: string): PublicTableState => {
  const viewer = viewerId ? state.players.find((player) => player.userId === viewerId) : undefined;
  const showdownOpen = state.street === 'showdown' || state.street === 'complete' || state.phase === 'payout';

  return {
    tableId: state.tableId,
    gameType: state.config.gameType,
    name: state.config.name,
    phase: state.phase,
    street: state.street,
    handId: state.handId,
    handNumber: state.handNumber,
    players: state.players.map((player) => {
      const visible =
        player.userId === viewerId ||
        (showdownOpen && player.revealed);
      return {
        userId: player.userId,
        username: player.username,
        avatar: player.avatar,
        seatIndex: player.seatIndex,
        chips: player.chips,
        status: player.status,
        holeCards: visible ? player.holeCards : null,
        holeCardCount: player.holeCards.length,
        betThisStreet: player.betThisStreet,
        committed: player.committed,
        lastAction: player.lastAction,
        isDealer: player.isDealer,
        isSmallBlind: player.isSmallBlind,
        isBigBlind: player.isBigBlind,
        isBot: player.isBot,
        revealed: player.revealed,
        sittingOut: player.sittingOut,
        hasDrawn: player.hasDrawn,
      };
    }),
    communityCards: state.communityCards,
    pot: state.pot,
    sidePots: state.sidePots,
    currentPlayerId: state.currentPlayerId,
    dealerPosition: state.dealerPosition,
    smallBlindPosition: state.smallBlindPosition,
    bigBlindPosition: state.bigBlindPosition,
    currentBet: state.currentBet,
    minimumRaise: state.minimumRaise,
    actionDeadline: state.actionDeadline,
    myCards: viewer?.holeCards || [],
    allowedActions: viewerId ? getLegalActions(state, viewerId) : [],
    showdown: state.showdown,
    maxSeats: state.config.maxSeats,
    blinds: { small: state.config.smallBlind, big: state.config.bigBlind },
    buyIn: { min: state.config.buyInMin, max: state.config.buyInMax },
    fillBots: state.config.fillBots,
    botFillAt: state.botFillAt ?? null,
    status: state.status,
  };
};

export const cloneTableState = (state: TableState): TableState =>
  JSON.parse(JSON.stringify(state)) as TableState;

export const chooseBotAction = (state: TableState, playerId: string): PokerActionInput => {
  const legal = getLegalActions(state, playerId);
  const player = state.players.find((item) => item.userId === playerId);
  if (!player || legal.length === 0) return timeoutActionFor(state, playerId);

  if (state.street === 'draw') {
    return { type: 'draw', discardIndexes: chooseDrawDiscards(player.holeCards) };
  }
  if (legal.some((action) => action.type === 'check')) return { type: 'check' };

  const call = legal.find((action) => action.type === 'call');
  if (call) {
    const amount = call.amount || 0;
    if (amount <= Math.max(state.config.bigBlind * 2, Math.floor(player.chips * 0.35))) {
      return { type: 'call' };
    }
    return { type: 'fold' };
  }

  if (legal.some((action) => action.type === 'fold')) return { type: 'fold' };
  return timeoutActionFor(state, playerId);
};

const chooseDrawDiscards = (cards: Card[]): number[] => {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => (counts.get(card.rank) || 0) < 2)
    .map(({ index }) => index)
    .slice(0, 3);
};

export const legalActionsFor = (state: TableState, playerId: string): AllowedAction[] =>
  getLegalActions(state, playerId);

export { nextOccupiedSeat };
