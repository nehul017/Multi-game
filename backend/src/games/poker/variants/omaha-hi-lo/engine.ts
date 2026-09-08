import { evaluateOmahaHigh } from '../../core/evaluator';
import { evaluateOmahaLow } from './low-hand';
import { OMAHA_HI_LO_RULES } from './rules';

export const omahaHiLoEngine = {
  rules: OMAHA_HI_LO_RULES,
  evaluateHigh: evaluateOmahaHigh,
  evaluateLow: evaluateOmahaLow,
};
