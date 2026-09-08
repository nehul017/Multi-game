import type { PokerGameType } from '../core/game-state';
import { FIVE_CARD_DRAW_RULES } from './five-card-draw/rules';
import { OMAHA_RULES } from './omaha/rules';
import { OMAHA_HI_LO_RULES } from './omaha-hi-lo/rules';
import { TEXAS_HOLDEM_RULES } from './texas-holdem/rules';
import type { VariantRules } from './types';

export type { VariantRules };

export const VARIANT_RULES: Record<PokerGameType, VariantRules> = {
  'texas-holdem': TEXAS_HOLDEM_RULES,
  omaha: OMAHA_RULES,
  'omaha-hi-lo': OMAHA_HI_LO_RULES,
  'five-card-draw': FIVE_CARD_DRAW_RULES,
};

export const getVariantRules = (gameType: PokerGameType): VariantRules => {
  const rules = VARIANT_RULES[gameType];
  if (!rules) {
    throw new Error(`Unknown poker variant: ${gameType}`);
  }
  return rules;
};
