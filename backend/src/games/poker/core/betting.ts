import { AppError } from '../../../utils/AppError';
import type { AllowedAction, PokerActionInput, TableState } from './game-state';
import { actionablePlayers, type SeatPlayer } from './player';

export const toCallAmount = (state: TableState, player: SeatPlayer): number =>
  Math.max(0, state.currentBet - player.betThisStreet);

export const getLegalActions = (state: TableState, playerId: string): AllowedAction[] => {
  if (state.street === 'draw') {
    const drawer = state.players.find((player) => player.userId === playerId);
    if (!drawer || state.currentPlayerId !== playerId || drawer.status !== 'active') return [];
    return [{ type: 'draw' }];
  }

  if (state.currentPlayerId !== playerId) return [];
  const player = state.players.find((item) => item.userId === playerId);
  if (!player || player.status !== 'active' || player.chips <= 0) return [];

  const toCall = toCallAmount(state, player);
  const actions: AllowedAction[] = [{ type: 'fold' }];

  if (toCall === 0) {
    actions.push({ type: 'check' });
    if (player.chips > 0) {
      const minBet = Math.min(player.chips, state.config.bigBlind);
      actions.push({ type: 'bet', min: minBet, max: player.chips });
    }
  } else if (player.chips > toCall) {
    actions.push({ type: 'call', amount: toCall });
    const minRaiseTo = state.currentBet + state.minimumRaise;
    const maxRaiseTo = player.chips + player.betThisStreet;
    if (maxRaiseTo > state.currentBet) {
      actions.push({
        type: 'raise',
        min: Math.min(minRaiseTo, maxRaiseTo),
        max: maxRaiseTo,
      });
    }
  }

  if (player.chips > 0) {
    actions.push({ type: 'all-in', amount: player.chips });
  }

  return actions;
};

export const isActionLegal = (
  state: TableState,
  playerId: string,
  action: PokerActionInput
): AllowedAction | null => {
  const legal = getLegalActions(state, playerId);
  return legal.find((item) => item.type === action.type) || null;
};

const takeChips = (player: SeatPlayer, amount: number): number => {
  const paid = Math.min(player.chips, Math.max(0, amount));
  player.chips -= paid;
  player.betThisStreet += paid;
  player.committed += paid;
  if (player.chips === 0) player.status = 'all-in';
  return paid;
};

export const applyBettingAction = (
  state: TableState,
  player: SeatPlayer,
  action: PokerActionInput
): { potDelta: number; fullRaise: boolean } => {
  const toCall = toCallAmount(state, player);
  let potDelta = 0;
  let fullRaise = false;

  switch (action.type) {
    case 'fold':
      player.status = 'folded';
      player.lastAction = 'fold';
      player.hasActedThisStreet = true;
      return { potDelta: 0, fullRaise: false };

    case 'check':
      if (toCall > 0) throw new AppError('Cannot check when facing a bet', 400);
      player.lastAction = 'check';
      player.hasActedThisStreet = true;
      return { potDelta: 0, fullRaise: false };

    case 'call': {
      if (toCall <= 0) throw new AppError('Nothing to call', 400);
      potDelta = takeChips(player, toCall);
      player.lastAction = player.status === 'all-in' ? 'all-in' : 'call';
      player.hasActedThisStreet = true;
      return { potDelta, fullRaise: false };
    }

    case 'bet': {
      if (toCall > 0 || state.currentBet > 0) throw new AppError('Cannot bet when a bet is already open', 400);
      const amount = Math.floor(action.amount || 0);
      if (amount < state.config.bigBlind && amount < player.chips) {
        throw new AppError('Bet is below the minimum', 400);
      }
      if (amount <= 0 || amount > player.chips) throw new AppError('Invalid bet amount', 400);
      potDelta = takeChips(player, amount);
      state.currentBet = player.betThisStreet;
      state.lastRaiseSize = player.betThisStreet;
      state.minimumRaise = Math.max(state.config.bigBlind, player.betThisStreet);
      state.lastAggressorId = player.userId;
      fullRaise = true;
      player.lastAction = player.status === 'all-in' ? 'all-in' : 'bet';
      player.hasActedThisStreet = true;
      return { potDelta, fullRaise };
    }

    case 'raise': {
      if (state.currentBet <= 0) throw new AppError('Nothing to raise', 400);
      const raiseTo = Math.floor(action.amount || 0);
      const minRaiseTo = state.currentBet + state.minimumRaise;
      const maxRaiseTo = player.chips + player.betThisStreet;
      if (raiseTo < minRaiseTo && raiseTo < maxRaiseTo) {
        throw new AppError(`Minimum raise is ${minRaiseTo}`, 400);
      }
      if (raiseTo <= state.currentBet || raiseTo > maxRaiseTo) {
        throw new AppError('Invalid raise amount', 400);
      }
      potDelta = takeChips(player, raiseTo - player.betThisStreet);
      const raiseSize = player.betThisStreet - state.currentBet;
      fullRaise = raiseSize >= state.minimumRaise;
      if (fullRaise) {
        state.minimumRaise = raiseSize;
        state.lastRaiseSize = raiseSize;
        state.lastAggressorId = player.userId;
        for (const other of state.players) {
          if (other.userId !== player.userId && other.status === 'active') {
            other.hasActedThisStreet = false;
          }
        }
      }
      state.currentBet = player.betThisStreet;
      player.lastAction = player.status === 'all-in' ? 'all-in' : 'raise';
      player.hasActedThisStreet = true;
      return { potDelta, fullRaise };
    }

    case 'all-in': {
      if (player.chips <= 0) throw new AppError('No chips remaining', 400);
      const allInTo = player.chips + player.betThisStreet;
      potDelta = takeChips(player, player.chips);
      if (allInTo > state.currentBet) {
        const raiseSize = allInTo - state.currentBet;
        fullRaise = raiseSize >= state.minimumRaise;
        if (fullRaise) {
          state.minimumRaise = raiseSize;
          state.lastRaiseSize = raiseSize;
          state.lastAggressorId = player.userId;
          for (const other of state.players) {
            if (other.userId !== player.userId && other.status === 'active') {
              other.hasActedThisStreet = false;
            }
          }
        }
        state.currentBet = allInTo;
      }
      player.lastAction = 'all-in';
      player.hasActedThisStreet = true;
      return { potDelta, fullRaise };
    }

    default:
      throw new AppError('Unsupported betting action', 400);
  }
};

export const bettingRoundComplete = (state: TableState): boolean => {
  const active = actionablePlayers(state.players);
  if (active.length === 0) return true;
  return active.every(
    (player) => player.hasActedThisStreet && player.betThisStreet === state.currentBet
  );
};

export const onlyOneContested = (state: TableState): boolean =>
  state.players.filter((player) => player.status === 'active' || player.status === 'all-in').length <= 1;

export const timeoutActionFor = (state: TableState, playerId: string): PokerActionInput => {
  const legal = getLegalActions(state, playerId);
  if (legal.some((action) => action.type === 'check')) return { type: 'check' };
  if (legal.some((action) => action.type === 'draw')) return { type: 'draw', discardIndexes: [] };
  return { type: 'fold' };
};
