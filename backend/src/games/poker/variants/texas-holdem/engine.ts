import { evaluateHoldEm } from '../../core/evaluator';
import { TEXAS_HOLDEM_RULES } from './rules';

export const texasHoldemEngine = {
  rules: TEXAS_HOLDEM_RULES,
  evaluate: evaluateHoldEm,
};
