import { SnakeMultiplayer } from '../../games/snake-multiplayer';

describe('SnakeMultiplayer Coil Rush engine', () => {
  const player1 = 'player1';
  const player2 = 'player2';
  const solo = { botCount: 0, skipCountdown: true };

  it('keeps classic free play open with no time limit', () => {
    const game = new SnakeMultiplayer([player1], solo);
    const opening = game.getGameState().board as { timeLimitMs?: number | null; phase?: string };
    expect(opening.timeLimitMs == null).toBe(true);

    const internal = game as unknown as { snakeState: { elapsedMs: number; phase: string } };
    internal.snakeState.elapsedMs = 300_000;
    game.tick();

    const later = game.getGameState().board as { phase?: string; timeLimitMs?: number | null };
    expect(later.phase).toBe('playing');
    expect(later.timeLimitMs == null).toBe(true);
    expect(game.isGameOver()).toBe(false);
  });

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
    const game = new SnakeMultiplayer([player1], { skipCountdown: true });
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
    const game = new SnakeMultiplayer([player1, player2], { botCount: 0, mode: 'survival', skipCountdown: true });
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

  it('rejects a 51st human player', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `p${i}`);
    const game = new SnakeMultiplayer(ids, solo);
    expect(game.addPlayer('overflow')).toBe(false);
  });

  it('rejects impossible steer payloads', () => {
    const game = new SnakeMultiplayer([player1], solo);
    expect(game.validateMove(player1, { angle: Number.NaN })).toBe(false);
    expect(game.validateMove(player1, { angle: Infinity })).toBe(false);
    expect(game.makeMove(player1, { angle: Number.NaN })).toBe(false);
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
    expect(before.food.some((f) => f.kind === 'normal' || f.kind === 'apple' || f.kind === 'burger')).toBe(true);
    expect(before.food.some((f) => f.kind === 'apple' || f.kind === 'orange' || f.kind === 'berry' || f.kind === 'banana')).toBe(true);
    expect(before.food.some((f) => f.kind === 'burger' || f.kind === 'pizza' || f.kind === 'fries' || f.kind === 'soda')).toBe(true);

    for (let i = 0; i < 8; i++) game.tick();
    const after = game.getGameState().board as { snakes: Array<{ energy: number }> };
    expect(after.snakes[0].energy).toBeLessThan(100);
    expect(game.isGameOver()).toBe(false);
  });

  it('runs a countdown before movement and a timed results phase', () => {
    const game = new SnakeMultiplayer([player1], { botCount: 0, roundMs: 200 });
    const opening = game.getGameState().board as { phase?: string; countdownMs?: number };
    expect(opening.phase).toBe('countdown');
    expect((opening.countdownMs || 0) > 0).toBe(true);

    for (let i = 0; i < 70; i++) game.tick();
    const playing = game.getGameState().board as { phase?: string };
    expect(playing.phase === 'playing' || playing.phase === 'results').toBe(true);
  });

  it('starts a titan coil in boss mode', () => {
    const game = new SnakeMultiplayer([player1], { mode: 'boss', skipCountdown: true });
    const board = game.getGameState().board as { snakes: Array<{ isBoss?: boolean }> };
    expect(board.snakes.some((s) => s.isBoss)).toBe(true);
  });

  it('keeps logical body spacing stable after movement, boost, and growth', () => {
    const game = new SnakeMultiplayer([player1], solo);
    const internal = game as unknown as {
      snakeState: { food: unknown[]; snakes: Array<{ mass: number; energy: number }> };
    };
    internal.snakeState.food = [];
    const snake = internal.snakeState.snakes[0];
    snake.mass = 36;
    expect(game.makeMove(player1, { angle: 0.15, boost: false })).toBe(true);
    for (let i = 0; i < 10; i++) game.tick();

    let board = game.getGameState().board as {
      snakes: Array<{ body: Array<{ x: number; y: number }>; length?: number; alive: boolean }>;
    };
    expect(board.snakes[0].alive).toBe(true);
    expect(board.snakes[0].length).toBe(board.snakes[0].body.length);
    expect(board.snakes[0].body.length).toBeGreaterThanOrEqual(48);

    snake.energy = 100;
    expect(game.makeMove(player1, { angle: 0.15, boost: true })).toBe(true);
    for (let i = 0; i < 16; i++) game.tick();
    board = game.getGameState().board as {
      snakes: Array<{ body: Array<{ x: number; y: number }>; length?: number; alive: boolean }>;
    };
    const body = board.snakes[0].body;
    expect(board.snakes[0].alive).toBe(true);
    expect(board.snakes[0].length).toBe(body.length);
    expect(body.length).toBeGreaterThanOrEqual(40);
    for (let i = 1; i < body.length; i++) {
      const gap = Math.hypot(body[i].x - body[i - 1].x, body[i].y - body[i - 1].y);
      expect(gap).toBeLessThan(8.4);
      expect(gap).toBeGreaterThan(3.2);
    }
  });

  it('does not drop every other network point on a long coil', () => {
    const game = new SnakeMultiplayer([player1], solo);
    const internal = game as unknown as {
      snakeState: { food: unknown[]; snakes: Array<{ mass: number }> };
    };
    internal.snakeState.food = [];
    internal.snakeState.snakes[0].mass = 70;
    for (let i = 0; i < 8; i++) game.tick();
    const board = game.getGameState().board as {
      snakes: Array<{ body: Array<{ x: number; y: number }>; length?: number }>;
    };
    expect(board.snakes[0].length).toBe(board.snakes[0].body.length);
    expect(board.snakes[0].body.length).toBeGreaterThan(70);
  });

  it('supports battle mode scoring on eliminations', () => {
    const game = new SnakeMultiplayer([player1, player2], { botCount: 0, mode: 'battle', skipCountdown: true });
    const board = game.getGameState().board as { mode?: string };
    expect(board.mode).toBe('battle');
    game.eliminatePlayer(player2);
    expect(game.isGameOver()).toBe(false);
  });
});
