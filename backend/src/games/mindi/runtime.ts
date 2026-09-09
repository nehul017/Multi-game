import { Server } from 'socket.io';
import { serializeGameState } from '../factory';
import { GameEngine } from '../engine';
import { mindiBotId } from '../ludo-bot';
import { FILL_EMPTY_SEAT_GAMES, maxPlayersFor } from '../core/limits';
import type { GameRoom } from '../core/types';
import { SOCKET_EVENTS } from '../../utils/constants';
import { emitCanonical } from '../../socket/game-runtime';
import { Mindi, isMindiEngine, getBotMove, botThinkDelay, resolveBotDifficulty } from './index';
import { MINDI_GAME_TYPE } from './types';

export const isMindiRoom = (room: GameRoom): boolean => room.gameType === MINDI_GAME_TYPE;

export const mindiSeatOrder = (room: GameRoom): string[] => {
  const stored = room.settings?.seatOrder;
  if (Array.isArray(stored) && stored.length) {
    return stored.map(String);
  }
  return Array.from(room.players.keys());
};

export const rejectReasonFromEngine = (engine: GameEngine | null): string => {
  if (engine && isMindiEngine(engine)) {
    return engine.getLastRejectReason() || 'You cannot play that card.';
  }
  return 'Invalid move';
};

export const authorizedSnapshot = (engine: GameEngine, viewerId?: string | null) =>
  serializeGameState(engine, viewerId === undefined ? undefined : viewerId);

export const emitAuthorized = (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  event: string,
  extra: Record<string, unknown>
): void => {
  if (!room.engine) return;
  const publicState = serializeGameState(room.engine);
  room.gameState = publicState;

  const playerSockets: string[] = [];
  for (const [playerId, slot] of room.players.entries()) {
    if (!slot.socketId) continue;
    playerSockets.push(slot.socketId);
    emitCanonical(gameNs.to(slot.socketId), event, {
      ...extra,
      gameState: serializeGameState(room.engine, playerId),
    });
  }

  const spectatorEmit = playerSockets.length
    ? gameNs.to(room.roomId).except(playerSockets)
    : gameNs.to(room.roomId);
  emitCanonical(spectatorEmit, event, {
    ...extra,
    gameState: publicState,
  });
};

export const fillMindiBots = (room: GameRoom): string[] => {
  const added: string[] = [];
  const max = maxPlayersFor(room.gameType);
  const existing = new Set(room.players.keys());
  let seat = 0;
  while (room.players.size < max) {
    let botId = mindiBotId(room.roomId, seat);
    while (existing.has(botId)) {
      seat += 1;
      botId = mindiBotId(room.roomId, seat);
    }
    room.players.set(botId, { socketId: '', ready: true, connected: true });
    existing.add(botId);
    added.push(botId);
    seat += 1;
  }
  for (const player of room.players.values()) {
    player.ready = true;
  }
  return added;
};

export const shouldFillAllSeats = (room: GameRoom): boolean =>
  FILL_EMPTY_SEAT_GAMES.has(room.gameType) && !room.engine && room.players.size < maxPlayersFor(room.gameType);

export const persistMindiSecrets = async (
  room: GameRoom,
  updateSettings: (matchId: string, patch: Record<string, unknown>) => Promise<unknown>
): Promise<void> => {
  if (!room.engine || !isMindiEngine(room.engine)) return;
  const seatOrder = Array.from(room.players.keys());
  room.settings = {
    ...(room.settings || {}),
    seatOrder,
    _deckSeed: room.engine.getDeckSeed(),
    botDifficulty: room.engine.getDifficulty(),
  };
  await updateSettings(room.matchId, {
    seatOrder,
    _deckSeed: room.engine.getDeckSeed(),
    botDifficulty: room.engine.getDifficulty(),
  });
};

export const appendMindiReplay = async (
  room: GameRoom,
  entry: Record<string, unknown>,
  patchReplay: (matchId: string, replayData: Record<string, unknown>) => Promise<unknown>
): Promise<void> => {
  const current = Array.isArray(room.settings?.mindiMoves) ? [...(room.settings!.mindiMoves as unknown[])] : [];
  current.push(entry);
  room.settings = { ...(room.settings || {}), mindiMoves: current };
  const previous = (room.gameState as { replayMoves?: unknown[] } | undefined)?.replayMoves;
  await patchReplay(room.matchId, {
    mindiMoves: current,
    lastPublic: {
      capturedTens: (room.engine as Mindi | null)?.getGameState().metadata?.capturedTens,
      tricksWon: (room.engine as Mindi | null)?.getGameState().metadata?.tricksWon,
    },
    replayMoves: previous,
  });
};

export const pickMindiBotMove = (room: GameRoom, botId: string): Record<string, unknown> | null => {
  if (!room.engine || !isMindiEngine(room.engine)) return null;
  return getBotMove(room.engine, botId);
};

export const mindiBotDelay = (room: GameRoom): number => {
  const difficulty = resolveBotDifficulty(
    room.settings?.botDifficulty || (room.engine && isMindiEngine(room.engine) ? room.engine.getDifficulty() : 'medium')
  );
  return botThinkDelay(difficulty);
};

export const isBotControlled = (room: GameRoom, playerId: string): boolean =>
  Boolean(room.botControlled?.has(playerId));

export const markBotControlled = (room: GameRoom, playerId: string): void => {
  if (!room.botControlled) room.botControlled = new Set();
  room.botControlled.add(playerId);
};

export const clearBotControlled = (room: GameRoom, playerId: string): void => {
  room.botControlled?.delete(playerId);
};

export const hydrateMindiPlayers = (room: GameRoom, settings: Record<string, unknown>): void => {
  const seatOrder = settings.seatOrder;
  if (!Array.isArray(seatOrder)) return;
  for (const raw of seatOrder) {
    const playerId = String(raw);
    if (room.players.has(playerId)) continue;
    room.players.set(playerId, {
      socketId: '',
      ready: true,
      connected: playerId.startsWith('bot:'),
    });
  }
};

export const mindiEngineSettings = (settings: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...settings,
  deckSeed: typeof settings._deckSeed === 'string' ? settings._deckSeed : settings.deckSeed,
  botDifficulty: resolveBotDifficulty(settings.botDifficulty),
});
