import { registerBuiltInGames } from '../../games/core/register-games';
import { gameRegistry } from '../../games/core/registry';
import { createGameEngine } from '../../games/factory';

describe('GameRegistry', () => {
  beforeAll(() => {
    registerBuiltInGames();
  });

  it('registers built-in match games', () => {
    expect(gameRegistry.has('tic-tac-toe')).toBe(true);
    expect(gameRegistry.has('connect-four')).toBe(true);
    expect(gameRegistry.has('chess')).toBe(true);
    expect(gameRegistry.has('ludo')).toBe(true);
    expect(gameRegistry.has('quiz-battle')).toBe(true);
    expect(gameRegistry.has('snake-multiplayer')).toBe(true);
    expect(gameRegistry.has('coil-rush')).toBe(true);
    expect(gameRegistry.has('mindi')).toBe(true);
  });

  it('registers poker, slots, and local games without engines', () => {
    expect(gameRegistry.get('poker')?.kind).toBe('table');
    expect(gameRegistry.get('classic-fruit-slots')?.kind).toBe('session');
    expect(gameRegistry.get('block-master')?.kind).toBe('session');
    expect(gameRegistry.get('puzzle-world')?.kind).toBe('session');
    expect(gameRegistry.get('jigsaw-world')?.kind).toBe('session');
    expect(gameRegistry.get('bottle-shooter-3d')?.kind).toBe('session');
    expect(gameRegistry.createEngine('poker', ['a', 'b'])).toBeNull();
  });

  it('creates engines through the factory/registry', () => {
    const engine = createGameEngine('tic-tac-toe', ['p1', 'p2']);
    expect(engine).not.toBeNull();
    expect(engine?.getCurrentPlayer()).toBe('p1');
  });

  it('exposes a public catalog for new-game onboarding', () => {
    const catalog = gameRegistry.toPublicCatalog();
    expect(catalog.find((game) => game.gameId === 'tic-tac-toe')?.minPlayers).toBe(2);
    expect(catalog.find((game) => game.gameId === 'snake-multiplayer')?.highFrequency).toBe(true);
  });

  it('throws for unknown games', () => {
    expect(() => gameRegistry.require('unknown-game')).toThrow('not registered');
  });
});
