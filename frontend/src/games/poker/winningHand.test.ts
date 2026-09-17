import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PokerCard, PublicSeatPlayer, ShowdownResult } from './types';
import {
  buildWinningHandView,
  formatCardNotation,
  formatChipAmount,
  formatHandNotation,
  handCategoryLabel,
  isShowdownStreet,
  partitionUsedCards,
  showdownResultKey,
  usesOmahaSplit,
} from './winningHand';

const card = (id: string, rank: string, suit: PokerCard['suit']): PokerCard => ({ id, rank, suit });

const Ah = card('Ah', 'A', 'hearts');
const Ad = card('Ad', 'A', 'diamonds');
const As = card('As', 'A', 'spades');
const Kh = card('Kh', 'K', 'hearts');
const Kd = card('Kd', 'K', 'diamonds');
const Kc = card('Kc', 'K', 'clubs');
const Th = card('Th', '10', 'hearts');
const Td = card('Td', '10', 'diamonds');
const Tc = card('Tc', '10', 'clubs');
const TwoC = card('2c', '2', 'clubs');
const ThreeS = card('3s', '3', 'spades');
const FourD = card('4d', '4', 'diamonds');
const FiveH = card('5h', '5', 'hearts');

const player = (
  userId: string,
  extras: Partial<PublicSeatPlayer> = {}
): PublicSeatPlayer => ({
  userId,
  username: userId === 'hero' ? 'You' : userId,
  avatar: '',
  seatIndex: extras.seatIndex ?? 0,
  chips: 400,
  status: extras.status ?? 'active',
  holeCards: extras.holeCards ?? null,
  holeCardCount: extras.holeCardCount ?? 2,
  betThisStreet: 0,
  committed: 0,
  isDealer: false,
  isSmallBlind: false,
  isBigBlind: false,
  isBot: extras.isBot ?? false,
  revealed: extras.revealed ?? false,
  sittingOut: false,
  hasDrawn: false,
  ...extras,
});

describe('winning hand helpers', () => {
  it('formats cards as rank plus suit symbols, not raw ids', () => {
    assert.equal(formatCardNotation(Th), '10♥');
    assert.equal(formatHandNotation([Ah, Ad, As, Kc, Kh]), 'A♥ A♦ A♠ K♣ K♥');
    assert.equal(handCategoryLabel('full-house', 'Full House, Aces over Kings'), 'FULL HOUSE');
    assert.equal(formatChipAmount(45), '$45.00');
  });

  it('keys a result to the hand id so duplicate events can be ignored', () => {
    assert.equal(showdownResultKey('hand-abc', 4), 'hand-abc');
    assert.equal(showdownResultKey(null, 7), 'hand-7');
    assert.equal(isShowdownStreet('complete', 'payout'), true);
    assert.equal(isShowdownStreet('flop', 'flop'), false);
  });

  it('partitions Omaha winning cards into exactly two hole and three community cards', () => {
    const hole = [Ah, Kd, TwoC, ThreeS];
    const board = [Ad, Kh, Tc, FourD, FiveH];
    const winning = [Ah, Kd, Ad, Kh, Tc];
    const used = partitionUsedCards(winning, hole, board);
    assert.equal(used.usedHoleCards.length, 2);
    assert.deepEqual(used.usedHoleCards.map((item) => item.id).sort(), ['Ah', 'Kd']);
    assert.equal(used.usedCommunityCards.length, 3);
    assert.equal(usesOmahaSplit('omaha'), true);
    assert.equal(usesOmahaSplit('texas-holdem'), false);
  });
});

describe('buildWinningHandView', () => {
  it('builds a Hold’em winner from backend showdown cards', () => {
    const showdown: ShowdownResult = {
      pots: [
        {
          potId: 'pot-0',
          label: 'MAIN POT',
          amount: 45,
          winners: [
            {
              userId: 'fiona',
              username: 'Felt Fiona',
              share: 45,
              winType: 'high',
              handName: 'Full House, Aces over Kings',
              category: 'full-house',
              winningCards: [Ah, Ad, As, Kc, Kh],
              usedHoleCards: [Ah, Ad],
              usedCommunityCards: [As, Kc, Kh],
            },
          ],
        },
      ],
      revealedPlayers: [
        {
          userId: 'fiona',
          username: 'Felt Fiona',
          holeCards: [Ah, Ad],
          handName: 'Full House, Aces over Kings',
          category: 'full-house',
          winningCards: [Ah, Ad, As, Kc, Kh],
        },
      ],
      highWinners: ['fiona'],
      lowWinners: [],
    };

    const view = buildWinningHandView({
      showdown,
      players: [player('fiona', { username: 'Felt Fiona', holeCards: [Ah, Ad] })],
      myId: 'fiona',
      communityCards: [As, Kc, Kh, TwoC, ThreeS],
      handId: 'hand-1',
      handNumber: 1,
    });

    assert.ok(view);
    assert.equal(view.headline, 'HAND WINNER');
    assert.equal(view.foldedWatcher, false);
    assert.equal(view.totalWon, 45);
    assert.deepEqual(view.winners[0].winningCards.map((item) => item.id), ['Ah', 'Ad', 'As', 'Kc', 'Kh']);
    assert.equal(view.winners[0].category, 'full-house');
  });

  it('marks a folded viewer without using their cards as the winning hand', () => {
    const showdown: ShowdownResult = {
      pots: [
        {
          potId: 'pot-0',
          label: 'MAIN POT',
          amount: 80,
          winners: [
            {
              userId: 'fiona',
              username: 'Felt Fiona',
              share: 80,
              winType: 'high',
              category: 'two-pair',
              handName: 'Two Pair, Aces and Tens',
              winningCards: [Ah, Ad, Th, Td, Kc],
            },
          ],
        },
      ],
      revealedPlayers: [
        {
          userId: 'fiona',
          username: 'Felt Fiona',
          holeCards: [Ah, Th],
          winningCards: [Ah, Ad, Th, Td, Kc],
          category: 'two-pair',
        },
      ],
      highWinners: ['fiona'],
      lowWinners: [],
    };

    const view = buildWinningHandView({
      showdown,
      players: [
        player('hero', { status: 'folded', holeCards: [TwoC, ThreeS], seatIndex: 0 }),
        player('fiona', { username: 'Felt Fiona', status: 'winner', holeCards: [Ah, Th], seatIndex: 1 }),
      ],
      myId: 'hero',
      communityCards: [Ad, Td, Kc, FourD, FiveH],
      handId: 'hand-fold',
      handNumber: 3,
    });

    assert.ok(view);
    assert.equal(view.foldedWatcher, true);
    assert.equal(view.winners[0].userId, 'fiona');
    assert.ok(!view.winners[0].winningCards.some((item) => item.id === '2c' || item.id === '3s'));
  });

  it('supports Omaha Hi-Lo high, low, and a scooped pot', () => {
    const showdown: ShowdownResult = {
      pots: [
        {
          potId: 'pot-0',
          label: 'MAIN POT',
          amount: 100,
          winners: [
            {
              userId: 'fiona',
              username: 'Felt Fiona',
              share: 50,
              winType: 'high',
              category: 'straight',
              handName: 'Nine-High Straight',
              winningCards: [Ah, Kd, ThreeS, FourD, FiveH],
              usedHoleCards: [Ah, Kd],
              usedCommunityCards: [ThreeS, FourD, FiveH],
            },
            {
              userId: 'fiona',
              username: 'Felt Fiona',
              share: 50,
              winType: 'low',
              lowHandName: 'A-2-3-4-5',
              lowWinningCards: [Ah, TwoC, ThreeS, FourD, FiveH],
              usedHoleCards: [Ah, TwoC],
              usedCommunityCards: [ThreeS, FourD, FiveH],
            },
          ],
        },
      ],
      revealedPlayers: [
        {
          userId: 'fiona',
          username: 'Felt Fiona',
          holeCards: [Ah, Kd, TwoC, Th],
          winningCards: [Ah, Kd, ThreeS, FourD, FiveH],
          lowWinningCards: [Ah, TwoC, ThreeS, FourD, FiveH],
        },
      ],
      highWinners: ['fiona'],
      lowWinners: ['fiona'],
    };

    const scooped = buildWinningHandView({
      showdown,
      players: [player('fiona', { username: 'Felt Fiona', holeCards: [Ah, Kd, TwoC, Th] })],
      myId: 'hero',
      communityCards: [ThreeS, FourD, FiveH, Kc, Td],
      handId: 'hand-scoop',
      handNumber: 8,
    });

    assert.ok(scooped);
    assert.equal(scooped.hasLow, true);
    assert.equal(scooped.winners[0].scooped, true);
    assert.equal(scooped.winners[0].totalWon, 100);
    assert.equal(scooped.lowWinners[0].lowHandName, 'A-2-3-4-5');

    const split: ShowdownResult = {
      ...showdown,
      pots: [
        {
          ...showdown.pots[0],
          winners: [
            showdown.pots[0].winners[0],
            {
              userId: 'river',
              username: 'River Rex',
              share: 50,
              winType: 'low',
              lowHandName: 'A-2-3-4-5',
              lowWinningCards: [Ah, TwoC, ThreeS, FourD, FiveH],
            },
          ],
        },
      ],
      lowWinners: ['river'],
    };

    const splitView = buildWinningHandView({
      showdown: split,
      players: [
        player('fiona', { username: 'Felt Fiona' }),
        player('river', { username: 'River Rex', seatIndex: 1 }),
      ],
      myId: 'hero',
      communityCards: [ThreeS, FourD, FiveH, Kc, Td],
      handId: 'hand-split',
      handNumber: 9,
    });

    assert.ok(splitView);
    assert.equal(splitView.highWinners[0].userId, 'fiona');
    assert.equal(splitView.lowWinners[0].userId, 'river');
    assert.equal(splitView.winners[0].scooped, false);
  });

  it('keeps main and side pots separate and handles a missing winner payload', () => {
    const showdown: ShowdownResult = {
      pots: [
        {
          potId: 'pot-0',
          label: 'MAIN POT',
          amount: 30,
          winners: [
            {
              userId: 'fiona',
              username: 'Felt Fiona',
              share: 30,
              winType: 'high',
              winningCards: [Ah, Ad, As, Kc, Kh],
              category: 'full-house',
            },
          ],
        },
        {
          potId: 'pot-1',
          label: 'SIDE POT 1',
          amount: 15,
          winners: [
            {
              userId: 'rex',
              username: 'River Rex',
              share: 15,
              winType: 'high',
              winningCards: [Kh, Kd, Kc, Th, Td],
              category: 'full-house',
            },
          ],
        },
      ],
      revealedPlayers: [],
      highWinners: ['fiona', 'rex'],
      lowWinners: [],
    };

    const view = buildWinningHandView({
      showdown,
      players: [player('fiona'), player('rex', { seatIndex: 1 })],
      myId: 'rex',
      communityCards: [As, Kc, Kh, Th, TwoC],
      handId: 'hand-side',
      handNumber: 4,
    });

    assert.ok(view);
    assert.equal(view.pots.length, 2);
    assert.equal(view.totalWon, 45);
    assert.equal(view.splitHigh, true);
    assert.equal(view.headline, 'HAND WINNERS');

    const empty = buildWinningHandView({
      showdown: { pots: [], revealedPlayers: [], highWinners: [], lowWinners: [] },
      players: [],
      myId: 'hero',
      communityCards: [],
      handId: 'hand-empty',
      handNumber: 5,
    });
    assert.ok(empty);
    assert.equal(empty.empty, true);
    assert.equal(empty.headline, 'HAND COMPLETE');
  });

  it('reuses the same result key when a duplicate showdown payload arrives', () => {
    const showdown: ShowdownResult = {
      pots: [
        {
          potId: 'pot-0',
          label: 'MAIN POT',
          amount: 20,
          winners: [{ userId: 'fiona', username: 'Felt Fiona', share: 20, winType: 'uncontested' }],
        },
      ],
      revealedPlayers: [],
      highWinners: ['fiona'],
      lowWinners: [],
    };
    const first = buildWinningHandView({
      showdown,
      players: [player('fiona')],
      myId: 'hero',
      communityCards: [],
      handId: 'hand-dup',
      handNumber: 2,
    });
    const second = buildWinningHandView({
      showdown: { ...showdown },
      players: [player('fiona')],
      myId: 'hero',
      communityCards: [],
      handId: 'hand-dup',
      handNumber: 2,
    });
    assert.equal(first?.resultKey, second?.resultKey);
    assert.equal(first?.uncontested, true);
  });
});
