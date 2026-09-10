import { GameEngine } from '../engine';
import { GAME_ERROR_CODES, GameError } from './errors';
import { GAME_LIMITS } from './limits';
import { GameDefinition } from './types';

class GameRegistry {
  private readonly games = new Map<string, GameDefinition>();

  register(definition: GameDefinition): void {
    this.games.set(definition.gameId, definition);
    if (definition.gameType !== definition.gameId) {
      this.games.set(definition.gameType, definition);
    }
  }

  alias(aliasId: string, gameId: string): void {
    const definition = this.games.get(gameId);
    if (definition) this.games.set(aliasId, definition);
  }

  has(gameId: string): boolean {
    return this.games.has(gameId);
  }

  get(gameId: string): GameDefinition | undefined {
    return this.games.get(gameId);
  }

  require(gameId: string): GameDefinition {
    const definition = this.games.get(gameId);
    if (!definition) {
      throw new GameError(GAME_ERROR_CODES.GAME_NOT_REGISTERED, `Game "${gameId}" is not registered`, {
        gameId,
      });
    }
    return definition;
  }

  list(): GameDefinition[] {
    const seen = new Set<string>();
    const unique: GameDefinition[] = [];
    for (const definition of this.games.values()) {
      if (seen.has(definition.gameId)) continue;
      seen.add(definition.gameId);
      unique.push(definition);
    }
    return unique;
  }

  createEngine(gameId: string, players: string[], settings: Record<string, unknown> = {}): GameEngine | null {
    const definition = this.games.get(gameId);
    if (!definition?.createEngine) return null;
    return definition.createEngine(players, settings);
  }

  toPublicCatalog(): Array<{
    gameId: string;
    gameType: string;
    name: string;
    kind: GameDefinition['kind'];
    minPlayers: number;
    maxPlayers: number;
    joinInProgress: boolean;
    fillBot: boolean;
    highFrequency: boolean;
  }> {
    return this.list().map((definition) => ({
      gameId: definition.gameId,
      gameType: definition.gameType,
      name: definition.name,
      kind: definition.kind,
      minPlayers: definition.minPlayers,
      maxPlayers: definition.maxPlayers,
      joinInProgress: Boolean(definition.joinInProgress),
      fillBot: Boolean(definition.fillBot),
      highFrequency: Boolean(definition.highFrequency),
    }));
  }
}

export const gameRegistry = new GameRegistry();

export const getRegisteredLimit = (gameType: string) => GAME_LIMITS[gameType];
