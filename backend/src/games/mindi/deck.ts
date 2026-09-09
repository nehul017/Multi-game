import { createHash, randomBytes, randomInt } from 'crypto';
import { createStandardDeck } from './cards';
import type { MindiCard } from './types';

export type Rng = () => number;

export const createDeckSeed = (): string => randomBytes(16).toString('hex');

export const createSeededRng = (seed: string): Rng => {
  const digest = createHash('sha256').update(seed).digest();
  let t = digest.readUInt32LE(0);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const createSecureRng = (): Rng => () => randomInt(0, 2 ** 32) / 2 ** 32;

export const shuffleDeck = (deck: MindiCard[], rng: Rng): MindiCard[] => {
  const next = deck.map((card) => ({ ...card }));
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
};

export const createShuffledDeck = (seed?: string, testDeck?: MindiCard[]): { deck: MindiCard[]; seed: string } => {
  if (testDeck) {
    if (testDeck.length !== 52) {
      throw new Error(`Test deck must contain 52 cards, got ${testDeck.length}`);
    }
    const ids = new Set(testDeck.map((card) => card.id));
    if (ids.size !== 52) {
      throw new Error('Test deck contains duplicate cards');
    }
    return { deck: testDeck.map((card) => ({ ...card })), seed: seed || 'test-deck' };
  }

  const resolvedSeed = seed || createDeckSeed();
  const rng = seed ? createSeededRng(resolvedSeed) : createSecureRng();
  return { deck: shuffleDeck(createStandardDeck(), rng), seed: resolvedSeed };
};

export const assertCompleteDeck = (cards: MindiCard[]): void => {
  if (cards.length !== 52) {
    throw new Error(`Expected 52 cards, got ${cards.length}`);
  }
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== 52) {
    throw new Error('Deck contains duplicate cards');
  }
};
