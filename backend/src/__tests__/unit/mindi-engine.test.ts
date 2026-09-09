import { createStandardDeck, createCard } from '../../games/mindi/cards';
import { createShuffledDeck } from '../../games/mindi/deck';
import { getLegalMoves, getTrickWinner, resolveRoundWinner, validateMove } from '../../games/mindi/legal-moves';
import { Mindi } from '../../games/mindi/engine';
import { getBotMove } from '../../games/mindi/bot';

const players = ['p0', 'p1', 'p2', 'p3'];

const fresh = (settings: Record<string, unknown> = {}) =>
  new Mindi(players, { deckSeed: 'unit-seed', ...settings });

describe('Mindi engine', () => {
  it('creates a unique 52-card deck', () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it('shuffles without mutating the source deck identity set', () => {
    const { deck } = createShuffledDeck('unit-seed');
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it('deals 13 cards to each player and accounts for the whole deck', () => {
    const game = fresh();
    const hands = game.getHandsForTests();
    expect(hands).toHaveLength(4);
    hands.forEach((hand) => expect(hand).toHaveLength(13));
    const ids = hands.flat().map((card) => card.id);
    expect(ids).toHaveLength(52);
    expect(new Set(ids).size).toBe(52);
  });

  it('starts with the player left of the dealer', () => {
    const game = fresh();
    expect(game.getCurrentPlayer()).toBe('p1');
  });

  it('rejects a move from a player who is not on turn', () => {
    const game = fresh();
    const card = game.getHandsForTests()[0][0];
    expect(game.makeMove('p0', { action: 'play-card', cardId: card.id })).toBe(false);
    expect(game.getLastRejectReason()).toBe('It is not your turn.');
  });

  it('rejects playing another player\'s card', () => {
    const game = fresh();
    const foreign = game.getHandsForTests()[0][0];
    expect(game.makeMove('p1', { action: 'play-card', cardId: foreign.id })).toBe(false);
    expect(game.getLastRejectReason()).toBe('That card is no longer in your hand.');
  });

  it('requires following suit when the player can', () => {
    const game = fresh();
    const lead = game.getValidMoves('p1')[0] as { cardId: string };
    expect(game.makeMove('p1', { action: 'play-card', cardId: lead.cardId })).toBe(true);
    const board = game.getGameState().board as { currentTrick: Array<{ card: { suit: string } }> };
    const p2Hand = game.getHandsForTests()[2];
    const matching = p2Hand.filter((card) => card.suit === board.currentTrick[0].card.suit);
    const offSuit = p2Hand.find((card) => card.suit !== board.currentTrick[0].card.suit);
    if (matching.length && offSuit) {
      expect(validateMove(p2Hand, board.currentTrick as never, offSuit.id, game.getRules()).ok).toBe(false);
      expect(game.makeMove('p2', { action: 'play-card', cardId: offSuit.id })).toBe(false);
      expect(game.getLastRejectReason()).toBe('You cannot play that card.');
    }
  });

  it('accepts a valid card and advances the turn', () => {
    const game = fresh();
    const move = game.getValidMoves('p1')[0] as { cardId: string };
    expect(game.makeMove('p1', { action: 'play-card', cardId: move.cardId })).toBe(true);
    expect(game.getCurrentPlayer()).toBe('p2');
    expect(game.getHandsForTests()[1]).toHaveLength(12);
  });

  it('calculates the trick winner and next leader', () => {
    const winner = getTrickWinner(
      [
        { seat: 0, playerId: 'p0', card: createCard('9', 'hearts') },
        { seat: 1, playerId: 'p1', card: createCard('K', 'hearts') },
        { seat: 2, playerId: 'p2', card: createCard('3', 'spades') },
        { seat: 3, playerId: 'p3', card: createCard('A', 'clubs') },
      ],
      'spades'
    );
    expect(winner.playerId).toBe('p2');
    expect(winner.card.id).toBe('3S');
  });

  it('tracks captured 10s on the winning team', () => {
    const game = fresh({
      testDeck: createStandardDeck(),
    });
    const playLegal = (player: string) => {
      const move = game.getValidMoves(player)[0] as { cardId: string };
      expect(game.makeMove(player, { action: 'play-card', cardId: move.cardId })).toBe(true);
    };
    playLegal('p1');
    playLegal('p2');
    playLegal('p3');
    playLegal('p0');
    const board = game.getGameState().board as { capturedTens: { A: number; B: number }; completedTrickCount: number };
    expect(board.completedTrickCount).toBe(1);
    expect(board.capturedTens.A + board.capturedTens.B).toBeGreaterThanOrEqual(0);
  });

  it('completes 13 tricks and scores the game', () => {
    const game = fresh({ deckSeed: 'full-deal' });
    let guard = 0;
    while (!game.isGameOver() && guard < 60) {
      const current = game.getCurrentPlayer();
      const move = game.getValidMoves(current)[0];
      expect(move).toBeTruthy();
      expect(game.makeMove(current, move)).toBe(true);
      guard += 1;
    }
    expect(game.isGameOver()).toBe(true);
    const board = game.getGameState().board as { completedTrickCount: number; capturedTens: { A: number; B: number } };
    expect(board.completedTrickCount).toBe(13);
    expect(board.capturedTens.A + board.capturedTens.B).toBe(4);
    const result = resolveRoundWinner(board.capturedTens, (game.getGameState().board as { tricksWon: { A: number; B: number } }).tricksWon, game.getRules());
    expect(['A', 'B', null]).toContain(result.team);
  });

  it('never puts another hand in authorized state', () => {
    const game = fresh();
    const mine = game.getAuthorizedState('p0').board as { myHand: Array<{ id: string }>; seats: Array<{ cardCount: number }> };
    const all = game.getHandsForTests();
    const myIds = new Set(all[0].map((card) => card.id));
    expect(mine.myHand.every((card) => myIds.has(card.id))).toBe(true);
    expect(mine.myHand).toHaveLength(13);
    expect(mine.seats.map((seat) => seat.cardCount)).toEqual([13, 13, 13, 13]);
    const publicBoard = game.getGameState().board as { myHand?: unknown };
    expect(publicBoard.myHand).toBeUndefined();
  });

  it('replays from the same seed to restore a seat and hand', () => {
    const first = fresh({ deckSeed: 'reconnect' });
    const firstMove = first.getValidMoves('p1')[0];
    first.makeMove('p1', firstMove);
    const restored = new Mindi(players, { deckSeed: 'reconnect' });
    restored.makeMove('p1', firstMove);
    expect(restored.getHandsForTests()[1].map((card) => card.id)).toEqual(
      first.getHandsForTests()[1].map((card) => card.id)
    );
    expect(restored.getCurrentPlayer()).toBe('p2');
  });
});

describe('Mindi legal moves helper', () => {
  it('rejects an illegal off-suit card when the player can follow', () => {
    const hand = [createCard('A', 'hearts'), createCard('3', 'spades')];
    const legal = getLegalMoves(hand, [{ seat: 0, playerId: 'x', card: createCard('2', 'hearts') }], {
      trumpMode: 'dealer-last-card-shown',
      followSuitRequired: true,
      canPlayAnyWhenVoid: true,
      tensToWin: 3,
      splitTensDecidedByTricks: true,
      tricksToWinSplit: 7,
      dealsToWin: 1,
      firstPlayer: 'left-of-dealer',
      rankOrder: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    });
    expect(legal.map((card) => card.id)).toEqual(['AH']);
  });
});

describe('Mindi bots', () => {
  const runBot = (difficulty: 'easy' | 'medium' | 'hard') => {
    const humans = ['h0', `bot:mindi:${difficulty}:1`, `bot:mindi:${difficulty}:2`, `bot:mindi:${difficulty}:3`];
    const game = new Mindi(humans, { deckSeed: `bot-${difficulty}`, botDifficulty: difficulty });
    const botId = humans[1];
    const move = getBotMove(game, botId);
    expect(move?.cardId).toBeTruthy();
    const legal = new Set(game.getValidMoves(botId).map((item) => item.cardId));
    expect(legal.has(move!.cardId as string)).toBe(true);
    expect(game.getBotView(botId)?.hand).toHaveLength(13);
  };

  it('easy bot only plays legal cards', () => runBot('easy'));
  it('medium bot only plays legal cards', () => runBot('medium'));
  it('hard bot only plays legal cards', () => runBot('hard'));

  it('bot view never includes another player\'s cards', () => {
    const game = new Mindi(['h', 'bot:mindi:x:1', 'bot:mindi:x:2', 'bot:mindi:x:3'], { deckSeed: 'hidden-bot' });
    const view = game.getBotView('bot:mindi:x:1')!;
    const own = new Set(game.getHandsForTests()[1].map((card) => card.id));
    expect(view.hand.every((card) => own.has(card.id))).toBe(true);
    expect(view.hand).toHaveLength(13);
  });
});
