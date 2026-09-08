import { evaluateFiveCardDraw } from '../../core/evaluator';
import { FIVE_CARD_DRAW_RULES } from './rules';

export const fiveCardDrawEngine = {
  rules: FIVE_CARD_DRAW_RULES,
  evaluate: evaluateFiveCardDraw,
};
