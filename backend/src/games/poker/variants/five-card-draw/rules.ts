import { evaluateFiveCardDraw } from '../../core/evaluator';
import type { PokerGameType, PokerStreet } from '../../core/game-state';
import type { VariantRules } from '../types';

export const FIVE_CARD_DRAW_RULES: VariantRules = {
  gameType: 'five-card-draw' as PokerGameType,
  holeCardCount: 5,
  communityCardCount: 0,
  hasDrawPhase: true,
  splitPot: false,
  streets: ['preflop', 'draw', 'draw-betting', 'showdown'] as PokerStreet[],
  communityDeal: {},
  evaluateHigh: (hole) => evaluateFiveCardDraw(hole),
  evaluateLow: () => null,
};
