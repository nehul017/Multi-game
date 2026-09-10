import type { GameRuntimeKind } from './types';

export interface GameLimitMeta {
  gameId: string;
  gameType: string;
  name: string;
  kind: GameRuntimeKind;
  minPlayers: number;
  maxPlayers: number;
  joinInProgress?: boolean;
  fillBot?: boolean;
  fillEmptySeats?: boolean;
  highFrequency?: boolean;
  simultaneousTurns?: boolean;
  supportsPause?: boolean;
}

export const GAME_LIMITS: Record<string, GameLimitMeta> = {
  'tic-tac-toe': {
    gameId: 'tic-tac-toe',
    gameType: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    kind: 'match',
    minPlayers: 2,
    maxPlayers: 2,
    fillBot: true,
  },
  'connect-four': {
    gameId: 'connect-four',
    gameType: 'connect-four',
    name: 'Connect Four',
    kind: 'match',
    minPlayers: 2,
    maxPlayers: 2,
    fillBot: true,
  },
  chess: {
    gameId: 'chess',
    gameType: 'chess',
    name: 'Chess',
    kind: 'match',
    minPlayers: 2,
    maxPlayers: 2,
  },
  ludo: {
    gameId: 'ludo',
    gameType: 'ludo',
    name: 'Ludo',
    kind: 'match',
    minPlayers: 2,
    maxPlayers: 4,
    fillBot: true,
  },
  'quiz-battle': {
    gameId: 'quiz-battle',
    gameType: 'quiz-battle',
    name: 'Quiz Battle',
    kind: 'match',
    minPlayers: 2,
    maxPlayers: 8,
    simultaneousTurns: true,
  },
  'snake-multiplayer': {
    gameId: 'snake-multiplayer',
    gameType: 'snake-multiplayer',
    name: 'Coil Rush',
    kind: 'match',
    minPlayers: 1,
    maxPlayers: 50,
    joinInProgress: true,
    highFrequency: true,
  },
  'coil-rush': {
    gameId: 'coil-rush',
    gameType: 'snake-multiplayer',
    name: 'Coil Rush',
    kind: 'match',
    minPlayers: 1,
    maxPlayers: 50,
    joinInProgress: true,
    highFrequency: true,
  },
  'classic-fruit-slots': {
    gameId: 'classic-fruit-slots',
    gameType: 'classic-fruit-slots',
    name: 'Classic Fruit Slots',
    kind: 'session',
    minPlayers: 1,
    maxPlayers: 1,
  },
  poker: {
    gameId: 'poker',
    gameType: 'poker',
    name: 'Poker Room',
    kind: 'table',
    minPlayers: 2,
    maxPlayers: 9,
  },
  'block-master': {
    gameId: 'block-master',
    gameType: 'block-master',
    name: 'Block Master',
    kind: 'session',
    minPlayers: 1,
    maxPlayers: 1,
  },
  'puzzle-world': {
    gameId: 'puzzle-world',
    gameType: 'puzzle-world',
    name: 'Puzzle World',
    kind: 'session',
    minPlayers: 1,
    maxPlayers: 1,
  },
  'jigsaw-world': {
    gameId: 'jigsaw-world',
    gameType: 'jigsaw-world',
    name: 'Jigsaw World',
    kind: 'session',
    minPlayers: 1,
    maxPlayers: 1,
  },
  mindi: {
    gameId: 'mindi',
    gameType: 'mindi',
    name: 'Mindi Cot',
    kind: 'match',
    minPlayers: 4,
    maxPlayers: 4,
    fillBot: true,
    fillEmptySeats: true,
  },
};

export const GAME_PLAYER_LIMITS: Record<string, { min: number; max: number }> = Object.fromEntries(
  Object.values(GAME_LIMITS).flatMap((meta) => {
    const limit = { min: meta.minPlayers, max: meta.maxPlayers };
    const rows: Array<[string, { min: number; max: number }]> = [[meta.gameType, limit]];
    if (meta.gameId !== meta.gameType) rows.push([meta.gameId, limit]);
    return rows;
  })
);

export const JOIN_IN_PROGRESS_GAMES = new Set(
  Object.values(GAME_LIMITS).filter((meta) => meta.joinInProgress).map((meta) => meta.gameType)
);

export const FILL_BOT_GAMES = new Set(
  Object.values(GAME_LIMITS).filter((meta) => meta.fillBot).map((meta) => meta.gameType)
);

export const FILL_EMPTY_SEAT_GAMES = new Set(
  Object.values(GAME_LIMITS).filter((meta) => meta.fillEmptySeats).map((meta) => meta.gameType)
);

export const HIGH_FREQUENCY_GAMES = new Set(
  Object.values(GAME_LIMITS).filter((meta) => meta.highFrequency).map((meta) => meta.gameType)
);

export const SIMULTANEOUS_TURN_GAMES = new Set(
  Object.values(GAME_LIMITS).filter((meta) => meta.simultaneousTurns).map((meta) => meta.gameType)
);

export const maxPlayersFor = (gameType: string): number => GAME_PLAYER_LIMITS[gameType]?.max ?? 2;

export const minPlayersToStart = (gameType: string): number => GAME_PLAYER_LIMITS[gameType]?.min ?? 2;
