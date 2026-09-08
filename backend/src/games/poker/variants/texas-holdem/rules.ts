import { evaluateHoldEm } from '../../core/evaluator';
import type { PokerGameType, PokerStreet } from '../../core/game-state';
import type { VariantRules } from '../types';

export const TEXAS_HOLDEM_RULES: VariantRules = {
  gameType: 'texas-holdem' as PokerGameType,
  holeCardCount: 2,
  communityCardCount: 5,
  hasDrawPhase: false,
  splitPot: false,
  streets: ['preflop', 'flop', 'turn', 'river', 'showdown'] as PokerStreet[],
  communityDeal: { flop: 3, turn: 1, river: 1 },
  evaluateHigh: (hole, community) => evaluateHoldEm(hole, community),
  evaluateLow: () => null,
};
