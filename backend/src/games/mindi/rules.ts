import type { MindiRules, Rank } from './types';

export const DEFAULT_RANK_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Isolated Mendikot / Mindi Cot rule set.
 *
 * Default is the common 52-card partnership variant:
 * - Trump is the dealer's last dealt card (shown).
 * - Players must follow the lead suit when they can.
 * - Void of lead suit: any card may be played, including trump.
 * - Highest trump wins the trick; otherwise highest card of the lead suit.
 * - Team with 3+ tens wins. 2-2 tens is decided by 7+ tricks.
 * - All 4 tens = Mendikot. All 13 tricks = whitewash.
 *
 * Change defaults here or pass `settings.rules` when creating a match.
 */
export const DEFAULT_MINDI_RULES: MindiRules = {
  trumpMode: 'dealer-last-card-shown',
  followSuitRequired: true,
  canPlayAnyWhenVoid: true,
  tensToWin: 3,
  splitTensDecidedByTricks: true,
  tricksToWinSplit: 7,
  dealsToWin: 1,
  firstPlayer: 'left-of-dealer',
  rankOrder: DEFAULT_RANK_ORDER,
};

export const resolveMindiRules = (overrides?: Partial<MindiRules>): MindiRules => ({
  ...DEFAULT_MINDI_RULES,
  ...overrides,
  rankOrder: overrides?.rankOrder?.length ? overrides.rankOrder : DEFAULT_MINDI_RULES.rankOrder,
});

export const teamForSeat = (seat: number): 'A' | 'B' => (seat % 2 === 0 ? 'A' : 'B');

export const partnerSeat = (seat: number): number => (seat + 2) % 4;

export const nextSeat = (seat: number): number => (seat + 1) % 4;
