import type { Card } from './card';

export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'all-in' | 'sitting-out' | 'winner';
export type PokerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'draw';

export interface SeatPlayer {
  userId: string;
  username: string;
  avatar: string;
  seatIndex: number;
  chips: number;
  status: PlayerStatus;
  holeCards: Card[];
  betThisStreet: number;
  committed: number;
  lastAction?: PokerActionType;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isBot: boolean;
  revealed: boolean;
  hasActedThisStreet: boolean;
  hasDrawn: boolean;
  sittingOut: boolean;
}

export const createSeatPlayer = (input: {
  userId: string;
  username: string;
  avatar?: string;
  seatIndex: number;
  chips: number;
  isBot?: boolean;
}): SeatPlayer => ({
  userId: input.userId,
  username: input.username,
  avatar: input.avatar || '',
  seatIndex: input.seatIndex,
  chips: input.chips,
  status: 'waiting',
  holeCards: [],
  betThisStreet: 0,
  committed: 0,
  isDealer: false,
  isSmallBlind: false,
  isBigBlind: false,
  isBot: Boolean(input.isBot),
  revealed: false,
  hasActedThisStreet: false,
  hasDrawn: false,
  sittingOut: false,
});

export const resetPlayerForHand = (player: SeatPlayer): void => {
  player.holeCards = [];
  player.betThisStreet = 0;
  player.committed = 0;
  player.lastAction = undefined;
  player.isDealer = false;
  player.isSmallBlind = false;
  player.isBigBlind = false;
  player.revealed = false;
  player.hasActedThisStreet = false;
  player.hasDrawn = false;
  player.status = player.chips > 0 && !player.sittingOut ? 'active' : 'waiting';
};

export const seatedPlayers = (players: SeatPlayer[]): SeatPlayer[] =>
  players.filter((player) => !player.sittingOut && player.chips > 0);

export const livePlayers = (players: SeatPlayer[]): SeatPlayer[] =>
  players.filter((player) => player.status === 'active' || player.status === 'all-in');

export const actionablePlayers = (players: SeatPlayer[]): SeatPlayer[] =>
  players.filter((player) => player.status === 'active' && player.chips > 0);
