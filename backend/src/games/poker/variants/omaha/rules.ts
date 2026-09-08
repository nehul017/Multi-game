import { evaluateOmahaHigh } from '../../core/evaluator';
import type { PokerGameType, PokerStreet } from '../../core/game-state';
import type { VariantRules } from '../types';

export const OMAHA_RULES: VariantRules = {
  gameType: 'omaha' as PokerGameType,
  holeCardCount: 4,
  communityCardCount: 5,
  hasDrawPhase: false,
  splitPot: false,
  streets: ['preflop', 'flop', 'turn', 'river', 'showdown'] as PokerStreet[],
  communityDeal: { flop: 3, turn: 1, river: 1 },
  evaluateHigh: (hole, community) => evaluateOmahaHigh(hole, community),
  evaluateLow: () => null,
};
