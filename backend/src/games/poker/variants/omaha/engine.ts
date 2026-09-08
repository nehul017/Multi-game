import { evaluateOmahaHigh } from '../../core/evaluator';
import { OMAHA_RULES } from './rules';

export const omahaEngine = {
  rules: OMAHA_RULES,
  evaluate: evaluateOmahaHigh,
};
