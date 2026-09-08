import { AppError } from '../../utils/AppError';
import { FRUIT_SLOTS_CONFIG } from './config';
import { SYMBOL_BY_ID } from './symbols';
import type {
  FruitSlotsConfig,
  RandomFn,
  ReelGrid,
  SpinOutcome,
  SymbolId,
  WinningLine,
} from './types';

const defaultRandom: RandomFn = () => Math.random();

export const isValidBetAmount = (
  bet: number,
  config: FruitSlotsConfig = FRUIT_SLOTS_CONFIG
): boolean =>
  Number.isInteger(bet) &&
  bet >= config.minBet &&
  bet <= config.maxBet &&
  bet % config.betStep === 0;

export const assertValidBet = (
  bet: number,
  config: FruitSlotsConfig = FRUIT_SLOTS_CONFIG
): void => {
  if (!isValidBetAmount(bet, config)) {
    throw new AppError(
      `Bet must be between ${config.minBet} and ${config.maxBet} in steps of ${config.betStep}`,
      400
    );
  }
};

export const selectWeightedSymbol = (
  random: RandomFn = defaultRandom,
  config: FruitSlotsConfig = FRUIT_SLOTS_CONFIG
): SymbolId => {
  const totalWeight = config.symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  if (totalWeight <= 0) {
    throw new AppError('Slot symbol weights are misconfigured', 500);
  }

  let ticket = random() * totalWeight;
  if (!Number.isFinite(ticket) || ticket < 0) {
    ticket = 0;
  }

  for (const symbol of config.symbols) {
    ticket -= symbol.weight;
    if (ticket < 0) {
      return symbol.id;
    }
  }

  return config.symbols[config.symbols.length - 1].id;
};

export const generateReels = (
  random: RandomFn = defaultRandom,
  config: FruitSlotsConfig = FRUIT_SLOTS_CONFIG
): ReelGrid => {
  const grid: ReelGrid = [];
  for (let row = 0; row < config.rowCount; row += 1) {
    const line: SymbolId[] = [];
    for (let reel = 0; reel < config.reelCount; reel += 1) {
      line.push(selectWeightedSymbol(random, config));
    }
    grid.push(line);
  }
  return grid;
};

export const evaluatePaylines = (
  reels: ReelGrid,
  bet: number,
  config: FruitSlotsConfig = FRUIT_SLOTS_CONFIG
): WinningLine[] => {
  const winners: WinningLine[] = [];

  for (const payline of config.paylines) {
    if (payline.pattern.length !== config.reelCount) continue;

    const cells = payline.pattern.map((row, reel) => ({ reel, row }));
    const symbols = cells.map(({ reel, row }) => reels[row]?.[reel]);
    if (symbols.some((symbol) => !symbol)) continue;

    const first = symbols[0] as SymbolId;
    let count = 1;
    for (let i = 1; i < symbols.length; i += 1) {
      if (symbols[i] !== first) break;
      count += 1;
    }

    if (count < 3) continue;

    const def = SYMBOL_BY_ID[first];
    const multiplier = def.payouts[count as 3 | 4 | 5];
    if (!multiplier) continue;

    winners.push({
      paylineId: payline.id,
      paylineName: payline.name,
      symbolId: first,
      count,
      cells: cells.slice(0, count),
      multiplier,
      payout: bet * multiplier,
    });
  }

  return winners;
};

export const calculatePayout = (winningLines: WinningLine[]): number =>
  winningLines.reduce((sum, line) => sum + line.payout, 0);

export const resolveSpin = (
  bet: number,
  options: { random?: RandomFn; reels?: ReelGrid; config?: FruitSlotsConfig } = {}
): SpinOutcome => {
  const config = options.config ?? FRUIT_SLOTS_CONFIG;
  assertValidBet(bet, config);

  const reels = options.reels ?? generateReels(options.random ?? defaultRandom, config);

  if (reels.length !== config.rowCount || reels.some((row) => row.length !== config.reelCount)) {
    throw new AppError('Invalid reel grid', 500);
  }

  const winningLines = evaluatePaylines(reels, bet, config);
  return {
    reels,
    winningLines,
    winAmount: calculatePayout(winningLines),
  };
};

export const fruitSlotsEngine = {
  isValidBetAmount,
  assertValidBet,
  selectWeightedSymbol,
  generateReels,
  evaluatePaylines,
  calculatePayout,
  resolveSpin,
};
