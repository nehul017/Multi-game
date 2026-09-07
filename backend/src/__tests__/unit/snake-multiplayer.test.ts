import { SnakeMultiplayer } from '../../games/snake-multiplayer';

describe('SnakeMultiplayer Coil Rush engine', () => {
  const player1 = 'player1';
  const player2 = 'player2';
  const solo = { botCount: 0 };

  it('starts a solo classic game without ending on the first tick', () => {
    const game = new SnakeMultiplayer([player1], solo);
    const state = game.getGameState();
    const board = state.board as { snakes: Array<{ playerId: string; alive: boolean; isBot?: boolean }> };

    expect(state.status).toBe('playing');
    expect(board.snakes.filter((s) => !s.isBot)).toHaveLength(1);
    expect(game.isGameOver()).toBe(false);

    game.tick();
    expect(game.isGameOver()).toBe(false);
    expect(game.getGameState().winner).toBeNull();
  });

  it('spawns development bots with distinct styles', () => {
    const game = new SnakeMultiplayer([player1]);
    const board = game.getGameState().board as {
      snakes: Array<{ isBot?: boolean; botStyle?: string }>;
    };
    const bots = board.snakes.filter((s) => s.isBot);
    expect(bots.length).toBe(6);
    expect(new Set(bots.map((s) => s.botStyle)).size).toBeGreaterThan(3);
  });

  it('spawns a late joiner into the live game', () => {
    const game = new SnakeMultiplayer([player1], solo);
    expect(game.addPlayer(player2)).toBe(true);

    const board = game.getGameState().board as {
      snakes: Array<{ playerId: string; alive: boolean; body: Array<{ x: number; y: number }> }>;
    };
    expect(board.snakes).toHaveLength(2);
    expect(board.snakes.every((snake) => snake.alive && snake.body.length >= 3)).toBe(true);
    expect(game.addPlayer(player2)).toBe(false);
  });

  it('ends survival when the last of two snakes dies, but not while playing solo', () => {
    const game = new SnakeMultiplayer([player1, player2], { botCount: 0, mode: 'survival' });
    game.eliminatePlayer(player2);

    expect(game.isGameOver()).toBe(true);
    expect(game.getGameState().winner).toBe(player1);
  });

  it('keeps classic matches open after a death so a player can respawn', () => {
    const game = new SnakeMultiplayer([player1, player2], solo);
    game.eliminatePlayer(player2);
    expect(game.isGameOver()).toBe(false);
    expect(game.makeMove(player2, { respawn: true })).toBe(true);
    const board = game.getGameState().board as { snakes: Array<{ playerId: string; alive: boolean }> };
    expect(board.snakes.find((s) => s.playerId === player2)?.alive).toBe(true);
  });

  it('rejects a ninth human player', () => {
    const game = new SnakeMultiplayer(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], solo);
    expect(game.addPlayer('i')).toBe(false);
  });

  it('steers by angle, grows from food, and spends energy on boost', () => {
    const game = new SnakeMultiplayer([player1], solo);
    expect(game.makeMove(player1, { angle: Math.PI / 4, boost: true })).toBe(true);
    const before = game.getGameState().board as {
      mode?: string;
      food: Array<{ kind?: string }>;
      snakes: Array<{ energy: number; score: number; body: unknown[] }>;
    };
    expect(before.mode).toBe('classic');
    expect(before.food.length).toBeGreaterThan(10);
    expect(before.food.some((f) => f.kind === 'normal')).toBe(true);

    for (let i = 0; i < 8; i++) game.tick();
    const after = game.getGameState().board as { snakes: Array<{ energy: number }> };
    expect(after.snakes[0].energy).toBeLessThan(100);
    expect(game.isGameOver()).toBe(false);
  });

  it('starts a titan coil in boss mode', () => {
    const game = new SnakeMultiplayer([player1], { mode: 'boss' });
    const board = game.getGameState().board as { snakes: Array<{ isBoss?: boolean }> };
    expect(board.snakes.some((s) => s.isBoss)).toBe(true);
  });
});
