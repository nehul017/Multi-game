import type { Card } from '../core/card';
import type { EvaluatedHand } from '../core/hand';
import type { PokerGameType, PokerStreet } from '../core/game-state';
import type { EvaluatedLowHand } from './omaha-hi-lo/low-hand';

export interface VariantRules {
  gameType: PokerGameType;
  holeCardCount: number;
  communityCardCount: number;
  hasDrawPhase: boolean;
  splitPot: boolean;
  streets: PokerStreet[];
  communityDeal: Partial<Record<'flop' | 'turn' | 'river', number>>;
  evaluateHigh: (hole: Card[], community: Card[]) => EvaluatedHand;
  evaluateLow: (hole: Card[], community: Card[]) => EvaluatedLowHand | null;
}
