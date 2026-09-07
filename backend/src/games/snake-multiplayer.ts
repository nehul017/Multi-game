import { GameEngine } from './engine';
import { steerBot } from './snake-bots';
import {
  COIL_SKIN_COLORS,
  type BotStyle,
  type CoilMode,
  type CoilTeam,
  type FoodKind,
  type SnakeMatchSettings,
} from './snake-types';

interface Point {
  x: number;
  y: number;
}

interface Food {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  r: number;
  kind: FoodKind;
}

interface Snake {
  playerId: string;
  name?: string;
  body: Point[];
  angle: number;
  targetAngle: number;
  boosting: boolean;
  alive: boolean;
  score: number;
  kills: number;
  color: string;
  radius: number;
  energy: number;
  isBot: boolean;
  botStyle?: BotStyle;
  isBoss?: boolean;
  team?: CoilTeam;
  skinId?: string;
  foodEaten: number;
  effects: { speedUntil: number; shieldUntil: number; magnetUntil: number };
  respawnAt: number | null;
}

interface SnakeGameState {
  mode: CoilMode;
  worldSize: number;
  arenaRadius: number;
  origin: Point;
  gridWidth: number;
  gridHeight: number;
  snakes: Snake[];
  food: Food[];
  tickRate: number;
  elapsedMs: number;
  timeLimitMs: number | null;
  tickIndex: number;
}

const FALLBACK_COLORS = ['#2ec4b6', '#ff6b35', '#7c5cff', '#ffd166', '#00e5ff', '#80ed99', '#ef476f', '#90e0ef'];
const BOT_STYLES: BotStyle[] = ['random', 'aggressive', 'defensive', 'hunter', 'beginner', 'advanced'];

export const SNAKE_MAX_PLAYERS = 8;
export const SNAKE_TICK_MS = 50;

const WORLD = 2400;
const CENTER = WORLD / 2;
const ARENA_RADIUS = 1080;
const BASE_SPEED = 3.6;
const BOOST_MULT = 1.55;
const TURN_RATE = 0.32;
const SPACING = 7;
const BASE_SEGS = 12;
const FOOD_TARGET = 86;
const HEAD_RADIUS = 9;
const MAX_ENERGY = 100;
const RESPAWN_MS = 2200;

const CARDINAL: Record<string, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const FOOD_VISUAL: Record<FoodKind, { color: string; value: number; r: number; weight: number }> = {
  normal: { color: '#7CFFB2', value: 1, r: 4.2, weight: 70 },
  large: { color: '#FFE066', value: 5, r: 7.5, weight: 12 },
  speed: { color: '#5CE1FF', value: 2, r: 6, weight: 7 },
  shield: { color: '#C4B5FD', value: 2, r: 6, weight: 5 },
  magnet: { color: '#FF8FAB', value: 2, r: 6, weight: 4 },
  crystal: { color: '#F472B6', value: 12, r: 9, weight: 2 },
};

const hypot = (x: number, y: number) => Math.hypot(x, y);

const normalizeAngle = (angle: number): number => {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const shortestDelta = (from: number, to: number): number => normalizeAngle(to - from);

const pickKind = (): FoodKind => {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const [kind, meta] of Object.entries(FOOD_VISUAL) as Array<[FoodKind, typeof FOOD_VISUAL.normal]>) {
    acc += meta.weight;
    if (roll <= acc) return kind;
  }
  return 'normal';
};

export class SnakeMultiplayer extends GameEngine {
  private snakeState: SnakeGameState;
  private settings: SnakeMatchSettings;
  private foodSeq = 0;

  constructor(players: string[], settings: SnakeMatchSettings = {}) {
    super(players);
    this.settings = settings;
    const mode = settings.mode || 'classic';
    this.snakeState = {
      mode,
      worldSize: WORLD,
      arenaRadius: ARENA_RADIUS,
      origin: { x: CENTER, y: CENTER },
      gridWidth: WORLD,
      gridHeight: WORLD,
      snakes: [],
      food: [],
      tickRate: SNAKE_TICK_MS,
      elapsedMs: 0,
      timeLimitMs: mode === 'time-rush' ? 120_000 : mode === 'teams' ? 180_000 : null,
      tickIndex: 0,
    };
    this.initGame();
  }

  initGame(): void {
    const humans = this.state.players.slice(0, SNAKE_MAX_PLAYERS);
    this.snakeState.snakes = humans.map((playerId, index) =>
      this.createSnake(playerId, index, {
        isBot: false,
        team: index % 2 === 0 ? 'ember' : 'tide',
        skinId: this.settings.skinByPlayer?.[playerId],
      })
    );

    const botCount =
      this.settings.botCount ??
      (this.snakeState.mode === 'friends' ? 0 : this.snakeState.mode === 'boss' ? 1 : 6);
    if (this.snakeState.mode === 'boss') {
      this.snakeState.snakes.push(
        this.createSnake('bot:boss', humans.length, {
          isBot: true,
          isBoss: true,
          botStyle: 'hunter',
          color: '#ff4d6d',
        })
      );
    } else {
      for (let i = 0; i < botCount; i++) {
        this.snakeState.snakes.push(
          this.createSnake(`bot:${BOT_STYLES[i % BOT_STYLES.length]}:${i}`, humans.length + i, {
            isBot: true,
            botStyle: BOT_STYLES[i % BOT_STYLES.length],
          })
        );
      }
    }

    this.spawnFood(FOOD_TARGET);
    this.syncBoard();
    this.state.status = 'playing';
  }

  addPlayer(playerId: string): boolean {
    if (this.isGameOver()) return false;
    if (this.state.players.includes(playerId)) return false;
    const humans = this.snakeState.snakes.filter((s) => !s.isBot).length;
    if (humans >= SNAKE_MAX_PLAYERS) return false;

    this.state.players.push(playerId);
    this.snakeState.snakes.push(
      this.createSnake(playerId, this.snakeState.snakes.length, {
        isBot: false,
        team: humans % 2 === 0 ? 'ember' : 'tide',
        skinId: this.settings.skinByPlayer?.[playerId],
      })
    );
    this.syncBoard();
    return true;
  }

  eliminatePlayer(playerId: string): void {
    const snake = this.snakeState.snakes.find((s) => s.playerId === playerId);
    if (!snake || !snake.alive) return;
    this.killSnake(snake);
    this.resolveEndCondition();
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (move.respawn === true) return Boolean(snake);
    return Boolean(snake && this.hasSteerInput(move));
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake || this.isGameOver()) return false;
    if (move.respawn === true && !snake.alive && this.allowsRespawn() && !snake.isBoss) {
      this.respawn(snake);
      return true;
    }
    if (!snake.alive || !this.hasSteerInput(move)) return false;

    if (typeof move.angle === 'number' && Number.isFinite(move.angle)) {
      snake.targetAngle = normalizeAngle(move.angle);
    } else if (typeof move.direction === 'string' && CARDINAL[move.direction] != null) {
      snake.targetAngle = CARDINAL[move.direction];
    }

    if (typeof move.boost === 'boolean') {
      snake.boosting = move.boost && snake.energy > 8;
    }

    this.syncBoard();
    return true;
  }

  tick(): void {
    if (this.isGameOver()) return;
    this.snakeState.tickIndex += 1;
    this.snakeState.elapsedMs += SNAKE_TICK_MS;

    for (const snake of this.snakeState.snakes) {
      if (
        !snake.alive &&
        snake.isBot &&
        snake.respawnAt != null &&
        this.allowsRespawn() &&
        this.now() >= snake.respawnAt
      ) {
        this.respawn(snake);
      }
      if (snake.isBot && snake.alive) {
        steerBot(snake, this.snakeState, this.snakeState.tickIndex);
      }
    }

    for (const snake of this.snakeState.snakes) {
      if (!snake.alive) continue;
      this.stepSnake(snake);
    }

    this.maintainFood();
    this.syncBoard();
    this.resolveEndCondition();
  }

  checkWin(): string | null {
    if (this.snakeState.mode === 'time-rush' || this.snakeState.mode === 'teams') {
      return this.leaderId();
    }
    if (this.snakeState.mode === 'boss') {
      const boss = this.snakeState.snakes.find((s) => s.isBoss);
      if (boss && !boss.alive) return this.leaderId(true);
    }
    const alive = this.snakeState.snakes.filter((s) => s.alive);
    if (this.snakeState.mode === 'survival' && alive.length === 1) return alive[0].playerId;
    return null;
  }

  checkDraw(): boolean {
    return this.snakeState.snakes.every((s) => !s.alive) && !this.allowsRespawn();
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake || !snake.alive) return [];
    return [{ angle: snake.angle, boost: false }];
  }

  private now(): number {
    return this.snakeState.elapsedMs;
  }

  private allowsRespawn(): boolean {
    return this.snakeState.mode !== 'survival';
  }

  private hasSteerInput(move: Record<string, unknown>): boolean {
    return (
      typeof move.angle === 'number' ||
      typeof move.boost === 'boolean' ||
      (typeof move.direction === 'string' && CARDINAL[move.direction] != null)
    );
  }

  private createSnake(
    playerId: string,
    index: number,
    extras: Partial<Snake>
  ): Snake {
    const spawnAngle = (index * 1.37) % (Math.PI * 2);
    const dist = extras.isBoss ? 40 : 320 + (index % 5) * 50;
    const x = CENTER + Math.cos(spawnAngle) * dist;
    const y = CENTER + Math.sin(spawnAngle) * dist;
    const facing = normalizeAngle(spawnAngle + Math.PI);
    const segs = extras.isBoss ? 48 : BASE_SEGS;
    const body: Point[] = [];
    for (let i = 0; i < segs; i++) {
      body.push({
        x: x - Math.cos(facing) * SPACING * i,
        y: y - Math.sin(facing) * SPACING * i,
      });
    }
    const skinId = extras.skinId;
    const color = extras.color || (skinId && COIL_SKIN_COLORS[skinId]) || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    return {
      playerId,
      body,
      angle: facing,
      targetAngle: facing,
      boosting: false,
      alive: true,
      score: extras.isBoss ? 80 : 0,
      kills: 0,
      color,
      radius: extras.isBoss ? 16 : HEAD_RADIUS,
      energy: MAX_ENERGY,
      isBot: Boolean(extras.isBot),
      botStyle: extras.botStyle,
      isBoss: extras.isBoss,
      team: extras.team,
      skinId,
      foodEaten: 0,
      effects: { speedUntil: 0, shieldUntil: 0, magnetUntil: 0 },
      respawnAt: null,
    };
  }

  private stepSnake(snake: Snake): void {
    const delta = shortestDelta(snake.angle, snake.targetAngle);
    snake.angle = normalizeAngle(snake.angle + Math.max(-TURN_RATE, Math.min(TURN_RATE, delta)));

    const sped = this.now() < snake.effects.speedUntil;
    let speed = BASE_SPEED * (sped ? 1.28 : 1) * (snake.isBoss ? 0.82 : 1);
    if (snake.boosting && snake.energy > 0) {
      speed *= BOOST_MULT;
      snake.energy = Math.max(0, snake.energy - 0.9);
      snake.score = Math.max(0, snake.score - 0.18);
      const tail = snake.body[snake.body.length - 1];
      if (tail && this.snakeState.tickIndex % 3 === 0) {
        this.snakeState.food.push(this.makeFood('normal', tail.x, tail.y, snake.color, 1, 3.4));
      }
      if (snake.energy <= 0) snake.boosting = false;
    } else {
      snake.energy = Math.min(MAX_ENERGY, snake.energy + 0.22);
      snake.boosting = false;
    }

    const head = snake.body[0];
    const next = {
      x: head.x + Math.cos(snake.angle) * speed,
      y: head.y + Math.sin(snake.angle) * speed,
    };

    if (hypot(next.x - CENTER, next.y - CENTER) > ARENA_RADIUS - snake.radius) {
      this.killSnake(snake);
      return;
    }

    if (this.now() >= snake.effects.shieldUntil && this.hitsSnake(next, snake)) {
      this.killSnake(snake);
      return;
    }

    const oldHead = { ...head };
    snake.body[0] = next;
    const neck = snake.body[1];
    if (!neck || hypot(next.x - neck.x, next.y - neck.y) >= SPACING) {
      snake.body.splice(1, 0, oldHead);
    }

    const desired = (snake.isBoss ? 48 : BASE_SEGS) + Math.floor(snake.score / 4);
    while (snake.body.length > desired) snake.body.pop();

    if (this.now() < snake.effects.magnetUntil) {
      this.pullFood(next, 90);
    }

    this.eatFood(snake, next);
  }

  private hitsSnake(point: Point, self: Snake): boolean {
    for (const other of this.snakeState.snakes) {
      if (!other.alive) continue;
      if (this.snakeState.mode === 'teams' && self.team && other.team === self.team) continue;
      const skip = other.playerId === self.playerId ? 10 : 2;
      for (let i = skip; i < other.body.length; i++) {
        if (hypot(point.x - other.body[i].x, point.y - other.body[i].y) < self.radius + 5) {
          if (other.playerId !== self.playerId) other.kills += 1;
          return true;
        }
      }
    }
    return false;
  }

  private eatFood(snake: Snake, head: Point): void {
    const keep: Food[] = [];
    for (const pellet of this.snakeState.food) {
      if (hypot(head.x - pellet.x, head.y - pellet.y) < snake.radius + pellet.r) {
        snake.score += pellet.value;
        snake.foodEaten += 1;
        this.applyFood(snake, pellet.kind);
      } else {
        keep.push(pellet);
      }
    }
    this.snakeState.food = keep;
  }

  private applyFood(snake: Snake, kind: FoodKind): void {
    const until = this.now() + 3500;
    if (kind === 'speed') snake.effects.speedUntil = until;
    if (kind === 'shield') snake.effects.shieldUntil = until;
    if (kind === 'magnet') snake.effects.magnetUntil = until;
    if (kind === 'crystal') snake.energy = Math.min(MAX_ENERGY, snake.energy + 18);
  }

  private pullFood(head: Point, radius: number): void {
    for (const pellet of this.snakeState.food) {
      const dx = head.x - pellet.x;
      const dy = head.y - pellet.y;
      const dist = hypot(dx, dy);
      if (dist > 0 && dist < radius) {
        pellet.x += (dx / dist) * 3.2;
        pellet.y += (dy / dist) * 3.2;
      }
    }
  }

  private killSnake(snake: Snake): void {
    if (!snake.alive) return;
    snake.alive = false;
    snake.boosting = false;
    for (let i = 0; i < snake.body.length; i += 2) {
      const seg = snake.body[i];
      this.snakeState.food.push(this.makeFood('large', seg.x, seg.y, snake.color, 2, 6));
    }
    snake.respawnAt = this.allowsRespawn() && !snake.isBoss ? this.now() + RESPAWN_MS : null;
  }

  private respawn(snake: Snake): void {
    const fresh = this.createSnake(snake.playerId, Math.floor(Math.random() * 12), {
      isBot: snake.isBot,
      botStyle: snake.botStyle,
      team: snake.team,
      skinId: snake.skinId,
      color: snake.color,
    });
    snake.body = fresh.body;
    snake.angle = fresh.angle;
    snake.targetAngle = fresh.targetAngle;
    snake.alive = true;
    snake.energy = MAX_ENERGY;
    snake.respawnAt = null;
    snake.effects = { speedUntil: 0, shieldUntil: 0, magnetUntil: 0 };
    if (snake.isBot) {
      snake.score = Math.max(0, Math.floor(snake.score * 0.65));
    } else {
      snake.score = 0;
      snake.foodEaten = 0;
      snake.kills = 0;
    }
  }

  private makeFood(kind: FoodKind, x: number, y: number, color?: string, value?: number, r?: number): Food {
    const vis = FOOD_VISUAL[kind];
    this.foodSeq += 1;
    return {
      id: `f${this.foodSeq}`,
      x,
      y,
      kind,
      value: value ?? vis.value,
      color: color ?? vis.color,
      r: r ?? vis.r,
    };
  }

  private spawnFood(count: number): void {
    for (let i = 0; i < count; i++) {
      const kind = pickKind();
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * (ARENA_RADIUS - 60);
      this.snakeState.food.push(
        this.makeFood(kind, CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius)
      );
    }
  }

  private maintainFood(): void {
    if (this.snakeState.food.length < FOOD_TARGET) {
      this.spawnFood(FOOD_TARGET - this.snakeState.food.length);
    }
  }

  private leaderId(humansOnly = false): string | null {
    const pool = this.snakeState.snakes.filter((s) => (humansOnly ? !s.isBot : true));
    if (this.snakeState.mode === 'teams') {
      const ember = pool.filter((s) => s.team === 'ember').reduce((sum, s) => sum + s.score, 0);
      const tide = pool.filter((s) => s.team === 'tide').reduce((sum, s) => sum + s.score, 0);
      const winning = ember === tide ? null : ember > tide ? 'ember' : 'tide';
      if (!winning) return null;
      return pool.filter((s) => s.team === winning).sort((a, b) => b.score - a.score)[0]?.playerId ?? null;
    }
    return [...pool].sort((a, b) => b.score - a.score)[0]?.playerId ?? null;
  }

  private resolveEndCondition(): void {
    const { mode, elapsedMs, timeLimitMs } = this.snakeState;
    if (timeLimitMs && elapsedMs >= timeLimitMs) {
      this.endGame(this.leaderId());
      return;
    }
    if (mode === 'survival') {
      const alive = this.snakeState.snakes.filter((s) => s.alive);
      if (alive.length === 0) this.endGame(null);
      else if (alive.length === 1 && this.snakeState.snakes.length > 1) this.endGame(alive[0].playerId);
      return;
    }
    if (mode === 'boss') {
      const boss = this.snakeState.snakes.find((s) => s.isBoss);
      const humansAlive = this.snakeState.snakes.some((s) => !s.isBot && s.alive);
      if (boss && !boss.alive) this.endGame(this.leaderId(true));
      else if (!humansAlive && !this.allowsRespawn()) this.endGame(boss?.playerId ?? null);
    }
  }

  private syncBoard(): void {
    this.state.board = this.snakeState;
    this.state.metadata = {
      mode: this.snakeState.mode,
      elapsedMs: this.snakeState.elapsedMs,
      timeLimitMs: this.snakeState.timeLimitMs,
    };
  }
}
