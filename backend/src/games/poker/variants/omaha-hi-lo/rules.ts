import { evaluateOmahaHigh } from '../../core/evaluator';
import type { PokerGameType, PokerStreet } from '../../core/game-state';
import type { VariantRules } from '../types';
import { evaluateOmahaLow } from './low-hand';

export const OMAHA_HI_LO_RULES: VariantRules = {
  gameType: 'omaha-hi-lo' as PokerGameType,
  holeCardCount: 4,
  communityCardCount: 5,
  hasDrawPhase: false,
  splitPot: true,
  streets: ['preflop', 'flop', 'turn', 'river', 'showdown'] as PokerStreet[],
  communityDeal: { flop: 3, turn: 1, river: 1 },
  evaluateHigh: (hole, community) => evaluateOmahaHigh(hole, community),
  evaluateLow: (hole, community) => evaluateOmahaLow(hole, community),
};
