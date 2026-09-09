import { GameEngine, GameState } from '../engine';
import { isBotPlayerId } from '../ludo-bot';
import { cloneCard, isTen, sortHand } from './cards';
import { assertCompleteDeck, createShuffledDeck } from './deck';
import {
  getLegalMoves,
  getTrickWinner,
  remainingTenSuits,
  resolveRoundWinner,
  tensInTrick,
  validateMove,
} from './legal-moves';
import { nextSeat, partnerSeat, resolveMindiRules, teamForSeat } from './rules';
import type {
  BotDifficulty,
  MindiAuthorizedBoard,
  MindiBotView,
  MindiCard,
  MindiCompletedTrick,
  MindiPhase,
  MindiPlayedCard,
  MindiPublicBoard,
  MindiRules,
  MindiSettings,
  Suit,
  TeamId,
} from './types';
import { MINDI_HAND_SIZE, MINDI_SEAT_COUNT, MINDI_TRICK_SIZE } from './types';

const REJECT = {
  NOT_YOUR_TURN: 'It is not your turn.',
  CARD_GONE: 'That card is no longer in your hand.',
  ILLEGAL: 'You cannot play that card.',
  NOT_ACTIVE: 'Game is not currently active.',
  ALREADY_STARTED: 'Game has already started.',
  UNKNOWN_PLAYER: 'Player is not in this game.',
  BAD_TRUMP: 'You cannot select trump now.',
} as const;

export class Mindi extends GameEngine {
  private readonly rules: MindiRules;
  private readonly difficulty: BotDifficulty;
  private deckSeed: string;
  private hands: MindiCard[][];
  private dealerSeat: number;
  private leaderSeat: number;
  private currentSeat: number;
  private currentTrick: MindiPlayedCard[];
  private completedTricks: MindiCompletedTrick[];
  private trumpSuit: Suit | null;
  private trumpRevealed: boolean;
  private hiddenTrumpCard: MindiCard | null;
  private capturedTens: Record<TeamId, number>;
  private capturedTenCards: Record<TeamId, MindiCard[]>;
  private tricksWon: Record<TeamId, number>;
  private phase: MindiPhase;
  private roundNumber: number;
  private moveNumber: number;
  private winnerTeam: TeamId | null;
  private winReason: string | null;
  private isMendikot: boolean;
  private isWhitewash: boolean;
  private lastRejectReason: string | null;
  private botThinkingSeat: number | null;

  constructor(players: string[], settings: MindiSettings = {}) {
    const unique = [...new Set(players)];
    super(unique.slice(0, MINDI_SEAT_COUNT));
    this.rules = resolveMindiRules(settings.rules);
    this.difficulty = settings.botDifficulty || 'medium';
    this.hands = [[], [], [], []];
    this.dealerSeat = settings.dealerSeat ?? 0;
    this.leaderSeat = nextSeat(this.dealerSeat);
    this.currentSeat = this.leaderSeat;
    this.currentTrick = [];
    this.completedTricks = [];
    this.trumpSuit = null;
    this.trumpRevealed = false;
    this.hiddenTrumpCard = null;
    this.capturedTens = { A: 0, B: 0 };
    this.capturedTenCards = { A: [], B: [] };
    this.tricksWon = { A: 0, B: 0 };
    this.phase = 'waiting';
    this.roundNumber = 1;
    this.moveNumber = 0;
    this.winnerTeam = null;
    this.winReason = null;
    this.isMendikot = false;
    this.isWhitewash = false;
    this.lastRejectReason = null;
    this.botThinkingSeat = null;
    this.deckSeed = settings.deckSeed || '';
    this.initGame(settings);
  }

  initGame(settings: MindiSettings = {}): void {
    if (this.state.players.length !== MINDI_SEAT_COUNT) {
      this.phase = 'waiting';
      this.state.status = 'waiting';
      this.syncPublicState();
      return;
    }

    const dealt = createShuffledDeck(settings.deckSeed || this.deckSeed || undefined, settings.testDeck);
    this.deckSeed = dealt.seed;
    assertCompleteDeck(dealt.deck);

    this.hands = [[], [], [], []];
    let cursor = 0;
    for (let round = 0; round < MINDI_HAND_SIZE; round += 1) {
      for (let offset = 1; offset <= MINDI_SEAT_COUNT; offset += 1) {
        const seat = (this.dealerSeat + offset) % MINDI_SEAT_COUNT;
        this.hands[seat].push(dealt.deck[cursor]);
        cursor += 1;
      }
    }

    const dealerLast = this.hands[this.dealerSeat][this.hands[this.dealerSeat].length - 1];
    this.hiddenTrumpCard = dealerLast ? cloneCard(dealerLast) : null;

    if (this.rules.trumpMode === 'chooser') {
      this.trumpSuit = null;
      this.trumpRevealed = false;
      this.phase = 'trump_selection';
    } else if (this.rules.trumpMode === 'dealer-last-card-hidden') {
      this.trumpSuit = dealerLast?.suit ?? null;
      this.trumpRevealed = false;
      this.phase = 'playing';
    } else {
      this.trumpSuit = dealerLast?.suit ?? null;
      this.trumpRevealed = true;
      this.phase = 'playing';
    }

    this.leaderSeat = this.rules.firstPlayer === 'left-of-dealer' ? nextSeat(this.dealerSeat) : this.dealerSeat;
    this.currentSeat = this.leaderSeat;
    this.currentTrick = [];
    this.completedTricks = [];
    this.capturedTens = { A: 0, B: 0 };
    this.capturedTenCards = { A: [], B: [] };
    this.tricksWon = { A: 0, B: 0 };
    this.moveNumber = 0;
    this.winnerTeam = null;
    this.winReason = null;
    this.isMendikot = false;
    this.isWhitewash = false;
    this.state.status = 'playing';
    this.state.winner = null;
    this.state.currentPlayer = this.state.players[this.currentSeat];
    this.syncPublicState();
  }

  getDeckSeed(): string {
    return this.deckSeed;
  }

  getLastRejectReason(): string | null {
    return this.lastRejectReason;
  }

  getRules(): MindiRules {
    return { ...this.rules };
  }

  getDifficulty(): BotDifficulty {
    return this.difficulty;
  }

  setBotThinking(playerId: string | null): void {
    this.botThinkingSeat = playerId ? this.seatOf(playerId) : null;
    this.syncPublicState();
  }

  getAuthorizedState(viewerId: string | null): GameState {
    return {
      ...this.state,
      board: this.buildAuthorizedBoard(viewerId),
      metadata: this.buildMetadata(viewerId),
    };
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    const seat = this.seatOf(player);
    if (seat < 0) return [];
    if (this.phase === 'trump_selection' && seat === this.dealerSeat) {
      return (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit) => ({
        action: 'select-trump',
        suit,
      }));
    }
    if (this.phase !== 'playing' || player !== this.state.currentPlayer) return [];
    return getLegalMoves(this.hands[seat], this.currentTrick, this.rules).map((card) => ({
      action: 'play-card',
      cardId: card.id,
    }));
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    this.lastRejectReason = null;
    if (this.isGameOver() || this.phase === 'game_complete') {
      this.lastRejectReason = REJECT.NOT_ACTIVE;
      return false;
    }

    const seat = this.seatOf(player);
    if (seat < 0) {
      this.lastRejectReason = REJECT.UNKNOWN_PLAYER;
      return false;
    }

    const action = String(move.action || (move.suit ? 'select-trump' : 'play-card'));

    if (action === 'select-trump') {
      if (this.phase !== 'trump_selection' || seat !== this.dealerSeat) {
        this.lastRejectReason = REJECT.BAD_TRUMP;
        return false;
      }
      const suit = move.suit as Suit;
      if (!['hearts', 'diamonds', 'clubs', 'spades'].includes(suit)) {
        this.lastRejectReason = REJECT.BAD_TRUMP;
        return false;
      }
      return true;
    }

    if (this.phase !== 'playing') {
      this.lastRejectReason = REJECT.NOT_ACTIVE;
      return false;
    }

    if (player !== this.state.currentPlayer) {
      this.lastRejectReason = REJECT.NOT_YOUR_TURN;
      return false;
    }

    const cardId = String(move.cardId || '');
    const result = validateMove(this.hands[seat], this.currentTrick, cardId, this.rules);
    if (!result.ok) {
      this.lastRejectReason = result.reason;
      return false;
    }
    return true;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const action = String(move.action || (move.suit ? 'select-trump' : 'play-card'));
    if (action === 'select-trump') {
      this.trumpSuit = move.suit as Suit;
      this.trumpRevealed = true;
      this.phase = 'playing';
      this.addMoveToHistory(player, 'select-trump', { suit: this.trumpSuit });
      this.syncPublicState();
      return true;
    }

    const seat = this.seatOf(player);
    const cardId = String(move.cardId);
    const hand = this.hands[seat];
    const index = hand.findIndex((card) => card.id === cardId);
    const [card] = hand.splice(index, 1);

    if (!this.trumpRevealed && this.trumpSuit && card.suit === this.trumpSuit && this.currentTrick.length > 0) {
      this.trumpRevealed = true;
    }

    this.currentTrick.push({ seat, playerId: player, card });
    this.moveNumber += 1;
    this.addMoveToHistory(player, 'play-card', { cardId: card.id, seat, trickNumber: this.completedTricks.length + 1 });

    if (this.currentTrick.length < MINDI_TRICK_SIZE) {
      this.currentSeat = nextSeat(this.currentSeat);
      this.state.currentPlayer = this.state.players[this.currentSeat];
      this.phase = 'playing';
      this.syncPublicState();
      return true;
    }

    this.resolveCurrentTrick();
    return true;
  }

  checkWin(): string | null {
    return this.state.winner;
  }

  checkDraw(): boolean {
    return this.state.status === 'draw';
  }

  getBotView(playerId: string): MindiBotView | null {
    const seat = this.seatOf(playerId);
    if (seat < 0) return null;
    const publicTrump = this.trumpForViewer(playerId);
    return {
      playerId,
      seat,
      team: teamForSeat(seat),
      partnerSeat: partnerSeat(seat),
      hand: this.hands[seat].map(cloneCard),
      legalCards: getLegalMoves(this.hands[seat], this.currentTrick, this.rules).map(cloneCard),
      currentTrick: this.currentTrick.map((played) => ({ ...played, card: cloneCard(played.card) })),
      leadSuit: this.currentTrick[0]?.card.suit ?? null,
      trumpSuit: publicTrump,
      trumpRevealed: this.trumpRevealed || this.canSeeHiddenTrump(playerId),
      playedCards: this.completedTricks.flatMap((trick) => trick.cards.map((played) => cloneCard(played.card))),
      remainingTens: remainingTenSuits(this.completedTricks),
      capturedTens: { ...this.capturedTens },
      tricksWon: { ...this.tricksWon },
      completedTricks: this.completedTricks.map((trick) => ({
        ...trick,
        cards: trick.cards.map((played) => ({ ...played, card: cloneCard(played.card) })),
        winningCard: cloneCard(trick.winningCard),
        tens: trick.tens.map(cloneCard),
      })),
      phase: this.phase,
      roundNumber: this.roundNumber,
      moveNumber: this.moveNumber,
      difficulty: this.difficulty,
    };
  }

  getHandsForTests(): MindiCard[][] {
    return this.hands.map((hand) => hand.map(cloneCard));
  }

  private resolveCurrentTrick(): void {
    const winner = getTrickWinner(this.currentTrick, this.trumpForPlay());
    const team = teamForSeat(winner.seat);
    const tens = tensInTrick(this.currentTrick);
    const completed: MindiCompletedTrick = {
      trickNumber: this.completedTricks.length + 1,
      cards: this.currentTrick.map((played) => ({ ...played, card: cloneCard(played.card) })),
      winnerSeat: winner.seat,
      winnerPlayerId: winner.playerId,
      winningCard: cloneCard(winner.card),
      team,
      tens: tens.map(cloneCard),
    };

    this.completedTricks.push(completed);
    this.tricksWon[team] += 1;
    this.capturedTens[team] += tens.length;
    this.capturedTenCards[team].push(...tens.map(cloneCard));
    this.leaderSeat = winner.seat;
    this.currentSeat = winner.seat;
    this.state.currentPlayer = this.state.players[this.currentSeat];
    this.currentTrick = [];

    if (this.completedTricks.length < MINDI_HAND_SIZE) {
      this.phase = 'playing';
      this.syncPublicState();
      return;
    }

    const result = resolveRoundWinner(this.capturedTens, this.tricksWon, this.rules);
    this.winnerTeam = result.team;
    this.winReason = result.reason;
    this.isMendikot = result.isMendikot;
    this.isWhitewash = result.isWhitewash;
    this.phase = 'game_complete';

    if (!result.team) {
      this.endGame(null);
    } else {
      const winners = this.state.players.filter((_, index) => teamForSeat(index) === result.team);
      const humanWinner = winners.find((id) => !isBotPlayerId(id));
      this.endGame(humanWinner || winners[0] || null);
    }
    this.syncPublicState();
  }

  private seatOf(playerId: string): number {
    return this.state.players.indexOf(playerId);
  }

  private trumpForPlay(): Suit | null {
    return this.trumpSuit;
  }

  private canSeeHiddenTrump(viewerId: string | null): boolean {
    if (!viewerId) return false;
    return this.seatOf(viewerId) === this.dealerSeat && this.rules.trumpMode === 'dealer-last-card-hidden';
  }

  private trumpForViewer(viewerId: string | null): Suit | null {
    if (this.trumpRevealed) return this.trumpSuit;
    if (this.canSeeHiddenTrump(viewerId)) return this.trumpSuit;
    return null;
  }

  private buildPublicBoard(viewerId: string | null = null): MindiPublicBoard {
    return {
      phase: this.phase,
      seats: this.state.players.map((playerId, seat) => ({
        seat,
        playerId,
        team: teamForSeat(seat),
        cardCount: this.hands[seat].length,
        isBot: isBotPlayerId(playerId),
        isDealer: seat === this.dealerSeat,
        isLeader: seat === this.leaderSeat,
      })),
      currentTrick: this.currentTrick.map((played) => ({ ...played, card: cloneCard(played.card) })),
      lastTrick: this.completedTricks.length
        ? this.completedTricks[this.completedTricks.length - 1]
        : null,
      completedTrickCount: this.completedTricks.length,
      tricksWon: { ...this.tricksWon },
      capturedTens: { ...this.capturedTens },
      capturedTenCards: {
        A: this.capturedTenCards.A.map(cloneCard),
        B: this.capturedTenCards.B.map(cloneCard),
      },
      trumpSuit: this.trumpForViewer(viewerId),
      trumpRevealed: this.trumpRevealed || this.canSeeHiddenTrump(viewerId),
      dealerSeat: this.dealerSeat,
      leaderSeat: this.leaderSeat,
      currentSeat: this.currentSeat,
      roundNumber: this.roundNumber,
      moveNumber: this.moveNumber,
      winnerTeam: this.winnerTeam,
      winReason: this.winReason,
      isMendikot: this.isMendikot,
      isWhitewash: this.isWhitewash,
      botThinkingSeat: this.botThinkingSeat,
    };
  }

  private buildAuthorizedBoard(viewerId: string | null): MindiAuthorizedBoard {
    const seat = viewerId ? this.seatOf(viewerId) : -1;
    const myHand = seat >= 0 ? sortHand(this.hands[seat].map(cloneCard)) : [];
    const legal =
      seat >= 0 && viewerId === this.state.currentPlayer && this.phase === 'playing'
        ? getLegalMoves(this.hands[seat], this.currentTrick, this.rules).map((card) => card.id)
        : [];

    return {
      ...this.buildPublicBoard(viewerId),
      mySeat: seat >= 0 ? seat : null,
      myHand,
      legalCardIds: legal,
    };
  }

  private buildMetadata(viewerId: string | null): Record<string, unknown> {
    const winners = this.winnerTeam
      ? this.state.players.filter((_, index) => teamForSeat(index) === this.winnerTeam)
      : [];
    return {
      gameType: 'mindi',
      winnerTeam: this.winnerTeam,
      winningPlayerIds: winners,
      winReason: this.winReason,
      isMendikot: this.isMendikot,
      isWhitewash: this.isWhitewash,
      capturedTens: { ...this.capturedTens },
      tricksWon: { ...this.tricksWon },
      botDifficulty: this.difficulty,
      viewerSeat: viewerId ? this.seatOf(viewerId) : -1,
    };
  }

  private syncPublicState(): void {
    this.state.board = this.buildPublicBoard(null);
    this.state.metadata = this.buildMetadata(null);
    this.state.currentPlayer = this.state.players[this.currentSeat] || this.state.currentPlayer;
  }
}

export const isMindiEngine = (engine: GameEngine): engine is Mindi => engine instanceof Mindi;
