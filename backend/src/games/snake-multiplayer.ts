import { GameEngine } from './engine';
import { SpatialHash } from './coil-spatial';
import {
  BODY_SEGMENT_SPACING,
  PATH_RECORD_MIN,
  clonePath,
  prunePath,
  recordHead,
  samplePath,
  samplePathByDistance,
} from './coil-path';
import { steerBot } from './snake-bots';
import {
  COIL_SKIN_COLORS,
  type BotStyle,
  type CoilFxEvent,
  type CoilMode,
  type CoilPhase,
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
  mass: number;
  color: string;
  r: number;
  kind: FoodKind;
}

interface Snake {
  playerId: string;
  name?: string;
  body: Point[];
  trail: Point[];
  angle: number;
  targetAngle: number;
  boosting: boolean;
  alive: boolean;
  score: number;
  mass: number;
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
  combo: number;
  lastFoodAt: number;
  survivedMs: number;
  effects: {
    speedUntil: number;
    shieldUntil: number;
    magnetUntil: number;
    ghostUntil: number;
    multiplierUntil: number;
  };
  respawnAt: number | null;
}

interface SnakeGameState {
  mode: CoilMode;
  phase: CoilPhase;
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
  countdownMs: number;
  resultsMs: number;
  roundIndex: number;
  tickIndex: number;
  online: number;
  events: CoilFxEvent[];
}

const FALLBACK_COLORS = ['#ff5a1f', '#2f9bff', '#39ffb0', '#8b5cff', '#84cc16', '#fb7185', '#f5c518', '#00e5ff'];
const BOT_STYLES: BotStyle[] = ['random', 'aggressive', 'defensive', 'hunter', 'beginner', 'advanced'];

export const SNAKE_MAX_PLAYERS = 50;
export const SNAKE_TICK_MS = 50;

const WORLD = 3200;
const CENTER = WORLD / 2;
const ARENA_RADIUS = 1480;
const BASE_SPEED = 3.6;
const BOOST_MULT = 1.72;
const TURN_RATE = 0.32;
const SPACING = BODY_SEGMENT_SPACING;
const BASE_SEGS = 12;
const TRAIL_MARGIN = SPACING * 8;
const MAX_NET_BODY_POINTS = 200;
const FOOD_TARGET = 140;
const HEAD_RADIUS = 9;
const MAX_ENERGY = 100;
const RESPAWN_MS = 2200;
const COUNTDOWN_MS = 3000;
const RESULTS_MS = 8000;
const COMBO_WINDOW_MS = 1600;
const KILL_SCORE = 500;
const SURVIVAL_SCORE_PER_SEC = 1;
const MAX_SPEED = BASE_SPEED * BOOST_MULT * 1.35;

const CARDINAL: Record<string, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const FOOD_VISUAL: Record<FoodKind, { color: string; value: number; mass: number; r: number; weight: number }> = {
  apple: { color: '#ef4444', value: 12, mass: 1.2, r: 7.2, weight: 15 },
  orange: { color: '#f97316', value: 12, mass: 1.2, r: 7, weight: 13 },
  berry: { color: '#a855f7', value: 10, mass: 1, r: 6.2, weight: 12 },
  banana: { color: '#facc15', value: 14, mass: 1.4, r: 7.4, weight: 10 },
  normal: { color: '#7CFFB2', value: 10, mass: 1, r: 4.4, weight: 8 },
  burger: { color: '#d97706', value: 40, mass: 3.2, r: 9.2, weight: 7 },
  pizza: { color: '#f59e0b', value: 45, mass: 3.5, r: 9.4, weight: 6 },
  fries: { color: '#fbbf24', value: 35, mass: 2.8, r: 8.6, weight: 5 },
  soda: { color: '#fb7185', value: 30, mass: 2.4, r: 8.2, weight: 4 },
  large: { color: '#FFE066', value: 50, mass: 4, r: 8.2, weight: 4 },
  gem: { color: '#67E8F9', value: 25, mass: 2, r: 6.2, weight: 3 },
  star: { color: '#FDE68A', value: 35, mass: 3, r: 6.8, weight: 3 },
  orb: { color: '#C4B5FD', value: 20, mass: 2, r: 6.4, weight: 2 },
  speed: { color: '#5CE1FF', value: 20, mass: 1, r: 6.2, weight: 2 },
  shield: { color: '#A78BFA', value: 20, mass: 1, r: 6.2, weight: 2 },
  magnet: { color: '#FF8FAB', value: 20, mass: 1, r: 6.2, weight: 1 },
  ghost: { color: '#E2E8F0', value: 20, mass: 1, r: 6.4, weight: 1 },
  multiplier: { color: '#F472B6', value: 20, mass: 1, r: 6.6, weight: 1 },
  crystal: { color: '#FB7185', value: 80, mass: 6, r: 9.4, weight: 1 },
};

const MODE_LIMIT: Record<CoilMode, number | null> = {
  classic: null,
  'time-rush': 120_000,
  battle: 180_000,
  survival: null,
  teams: 180_000,
  boss: null,
  friends: null,
};

const hypot = (x: number, y: number) => Math.hypot(x, y);

const normalizeAngle = (angle: number): number => {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const shortestDelta = (from: number, to: number): number => normalizeAngle(to - from);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const pickKind = (): FoodKind => {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const [kind, meta] of Object.entries(FOOD_VISUAL) as Array<[FoodKind, typeof FOOD_VISUAL.normal]>) {
    acc += meta.weight;
    if (roll <= acc) return kind;
  }
  return 'normal';
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export class SnakeMultiplayer extends GameEngine {
  private snakeState: SnakeGameState;
  private settings: SnakeMatchSettings;
  private foodSeq = 0;
  private fxSeq = 0;
  private readonly bodyGrid = new SpatialHash<{ x: number; y: number; owner: string; team?: CoilTeam; index: number }>(72);
  private readonly foodGrid = new SpatialHash<Food>(72);
  private readonly maxHumans: number;

  constructor(players: string[], settings: SnakeMatchSettings = {}) {
    super(players);
    this.settings = settings;
    const mode = settings.mode && MODE_LIMIT[settings.mode] !== undefined ? settings.mode : 'classic';
    const requested = Number(settings.maxPlayers);
    this.maxHumans = Number.isFinite(requested)
      ? clamp(Math.floor(requested), 1, SNAKE_MAX_PLAYERS)
      : SNAKE_MAX_PLAYERS;
    const countdownMs = settings.skipCountdown ? 0 : COUNTDOWN_MS;
    this.snakeState = {
      mode,
      phase: countdownMs > 0 ? 'countdown' : 'playing',
      worldSize: WORLD,
      arenaRadius: ARENA_RADIUS,
      origin: { x: CENTER, y: CENTER },
      gridWidth: WORLD,
      gridHeight: WORLD,
      snakes: [],
      food: [],
      tickRate: SNAKE_TICK_MS,
      elapsedMs: 0,
      timeLimitMs: settings.roundMs && settings.roundMs > 0 ? settings.roundMs : MODE_LIMIT[mode],
      countdownMs,
      resultsMs: 0,
      roundIndex: 1,
      tickIndex: 0,
      online: 0,
      events: [],
    };
    this.initGame();
  }

  initGame(): void {
    const humans = this.state.players.slice(0, this.maxHumans);
    this.snakeState.snakes = humans.map((playerId, index) =>
      this.createSnake(playerId, index, {
        isBot: false,
        team: index % 2 === 0 ? 'ember' : 'tide',
        skinId: this.settings.skinByPlayer?.[playerId],
        name: this.settings.nameByPlayer?.[playerId],
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
          name: 'Titan',
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
    if (humans >= this.maxHumans) return false;

    this.state.players.push(playerId);
    this.snakeState.snakes.push(
      this.createSnake(playerId, this.snakeState.snakes.length, {
        isBot: false,
        team: humans % 2 === 0 ? 'ember' : 'tide',
        skinId: this.settings.skinByPlayer?.[playerId],
        name: this.settings.nameByPlayer?.[playerId],
      })
    );
    this.syncBoard();
    return true;
  }

  eliminatePlayer(playerId: string): void {
    const snake = this.snakeState.snakes.find((s) => s.playerId === playerId);
    if (!snake || !snake.alive) return;
    this.killSnake(snake, null);
    this.resolveEndCondition();
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake) return false;
    if (move.respawn === true) return true;
    if (typeof move.angle === 'number' && !Number.isFinite(move.angle)) return false;
    if (typeof move.boost === 'boolean' && move.boost !== true && move.boost !== false) return false;
    return this.hasSteerInput(move);
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake || this.isGameOver()) return false;
    if (move.respawn === true && !snake.alive && this.allowsRespawn() && !snake.isBoss) {
      this.respawn(snake);
      this.syncBoard();
      return true;
    }
    if (!snake.alive || !this.hasSteerInput(move)) return false;
    if (this.snakeState.phase !== 'playing' && this.snakeState.phase !== 'countdown') return false;

    if (typeof move.angle === 'number' && Number.isFinite(move.angle)) {
      snake.targetAngle = normalizeAngle(move.angle);
    } else if (typeof move.direction === 'string' && CARDINAL[move.direction] != null) {
      snake.targetAngle = CARDINAL[move.direction];
    }

    if (typeof move.boost === 'boolean') {
      snake.boosting = move.boost && snake.energy > 8 && this.snakeState.phase === 'playing';
    }

    if (typeof move.name === 'string' && move.name.trim()) {
      snake.name = move.name.trim().slice(0, 20);
    }

    this.syncBoard();
    return true;
  }

  tick(): void {
    if (this.isGameOver()) return;
    this.snakeState.tickIndex += 1;
    this.snakeState.events = [];

    if (this.snakeState.phase === 'countdown') {
      this.snakeState.countdownMs = Math.max(0, this.snakeState.countdownMs - SNAKE_TICK_MS);
      if (this.snakeState.countdownMs <= 0) {
        this.snakeState.phase = 'playing';
        this.pushFx('power', this.snakeState.origin.x, this.snakeState.origin.y, '', 0, 'GO');
      }
      this.syncBoard();
      return;
    }

    if (this.snakeState.phase === 'round_end' || this.snakeState.phase === 'results') {
      this.snakeState.resultsMs += SNAKE_TICK_MS;
      if (this.snakeState.resultsMs >= RESULTS_MS) {
        this.startNewRound();
      }
      this.syncBoard();
      return;
    }

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

    this.rebuildGrids();

    for (const snake of this.snakeState.snakes) {
      if (!snake.alive) continue;
      this.stepSnake(snake);
    }

    this.maintainFood();
    this.awardSurvival();
    this.syncBoard();
    this.resolveEndCondition();
  }

  checkWin(): string | null {
    if (this.snakeState.phase === 'results' || this.snakeState.phase === 'round_end') {
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
      (typeof move.angle === 'number' && Number.isFinite(move.angle)) ||
      typeof move.boost === 'boolean' ||
      (typeof move.direction === 'string' && CARDINAL[move.direction] != null)
    );
  }

  private createSnake(playerId: string, index: number, extras: Partial<Snake>): Snake {
    const spawnAngle = (index * 1.37) % (Math.PI * 2);
    const dist = extras.isBoss ? 40 : 360 + (index % 7) * 58;
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
    const style = extras.botStyle;

    return {
      playerId,
      name: extras.name || (extras.isBoss ? 'Titan' : extras.isBot ? this.botName(style, index) : undefined),
      body,
      trail: clonePath(body),
      angle: facing,
      targetAngle: facing,
      boosting: false,
      alive: true,
      score: extras.isBoss ? 80 : 0,
      mass: extras.isBoss ? 36 : 0,
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
      combo: 0,
      lastFoodAt: -9999,
      survivedMs: 0,
      effects: { speedUntil: 0, shieldUntil: 0, magnetUntil: 0, ghostUntil: 0, multiplierUntil: 0 },
      respawnAt: null,
    };
  }

  private botName(style: BotStyle | undefined, index: number): string {
    const names: Record<string, string> = {
      random: 'Drift',
      aggressive: 'Ember',
      defensive: 'Tide',
      hunter: 'Viper',
      beginner: 'Spark',
      advanced: 'Nova',
    };
    return `${names[style || 'beginner']}-${(index % 9) + 1}`;
  }

  private rebuildGrids(): void {
    this.bodyGrid.clear();
    this.foodGrid.clear();
    for (const snake of this.snakeState.snakes) {
      if (!snake.alive) continue;
      for (let i = 2; i < snake.body.length; i++) {
        const seg = snake.body[i];
        this.bodyGrid.insert({ x: seg.x, y: seg.y, owner: snake.playerId, team: snake.team, index: i });
      }
    }
    for (const pellet of this.snakeState.food) {
      this.foodGrid.insert(pellet);
    }
  }

  private stepSnake(snake: Snake): void {
    const delta = shortestDelta(snake.angle, snake.targetAngle);
    snake.angle = normalizeAngle(snake.angle + clamp(delta, -TURN_RATE, TURN_RATE));

    const sped = this.now() < snake.effects.speedUntil;
    let speed = BASE_SPEED * (sped ? 1.28 : 1) * (snake.isBoss ? 0.82 : 1);
    if (snake.boosting && snake.energy > 0) {
      speed *= BOOST_MULT;
      snake.energy = Math.max(0, snake.energy - 0.95);
      if (this.snakeState.tickIndex % 6 === 0 && snake.mass > 0) {
        snake.mass = Math.max(0, snake.mass - 0.35);
        const tail = snake.body[snake.body.length - 1];
        if (tail) this.snakeState.food.push(this.makeFood('normal', tail.x, tail.y, snake.color, 6, 0.4, 3.2));
      }
      if (this.snakeState.tickIndex % 4 === 0) {
        const head = snake.body[0];
        this.pushFx('boost', head.x, head.y, snake.playerId);
      }
      if (snake.energy <= 0) snake.boosting = false;
    } else {
      snake.energy = Math.min(MAX_ENERGY, snake.energy + 0.24);
      snake.boosting = false;
    }

    speed = Math.min(speed, MAX_SPEED);
    const head = snake.body[0];
    const next = {
      x: head.x + Math.cos(snake.angle) * speed,
      y: head.y + Math.sin(snake.angle) * speed,
    };

    if (hypot(next.x - CENTER, next.y - CENTER) > ARENA_RADIUS - snake.radius) {
      this.killSnake(snake, null);
      return;
    }

    const ghosted = this.now() < snake.effects.ghostUntil;
    const shielded = this.now() < snake.effects.shieldUntil;
    if (!ghosted && !shielded) {
      const killer = this.hitsSnake(next, snake);
      if (killer) {
        this.awardKill(killer, snake);
        this.killSnake(snake, killer);
        return;
      }
    }

    const desired = (snake.isBoss ? 48 : BASE_SEGS) + Math.floor(snake.mass);
    if (!snake.trail?.length) snake.trail = clonePath(snake.body);
    recordHead(snake.trail, next, PATH_RECORD_MIN);
    prunePath(snake.trail, desired * SPACING + TRAIL_MARGIN);
    snake.body = samplePath(snake.trail, desired, SPACING, snake.body);

    if (this.now() < snake.effects.magnetUntil) {
      this.pullFood(next, 110);
    }

    this.eatFood(snake, next);
    snake.survivedMs += SNAKE_TICK_MS;
  }

  private hitsSnake(point: Point, self: Snake): Snake | null {
    const hits = this.bodyGrid.query(point.x, point.y, self.radius + 6);
    for (const hit of hits) {
      if (hit.owner === self.playerId && hit.index < 10) continue;
      if (this.snakeState.mode === 'teams' && self.team && hit.team === self.team) continue;
      const other = this.snakeState.snakes.find((s) => s.playerId === hit.owner);
      if (!other || !other.alive) continue;
      if (other.playerId === self.playerId && hit.index < 10) continue;
      return other.playerId === self.playerId ? null : other;
    }
    return null;
  }

  private eatFood(snake: Snake, head: Point): void {
    const nearby = this.foodGrid.query(head.x, head.y, snake.radius + 14);
    if (!nearby.length) return;
    const live = new Set(this.snakeState.food.map((pellet) => pellet.id));
    const eaten = new Set<string>();
    for (const pellet of nearby) {
      if (!live.has(pellet.id)) continue;
      if (hypot(head.x - pellet.x, head.y - pellet.y) >= snake.radius + pellet.r) continue;
      eaten.add(pellet.id);
      live.delete(pellet.id);
      const combo = this.now() - snake.lastFoodAt <= COMBO_WINDOW_MS ? snake.combo + 1 : 1;
      snake.combo = Math.min(combo, 8);
      snake.lastFoodAt = this.now();
      const mult = (this.now() < snake.effects.multiplierUntil ? 2 : 1) * (1 + Math.max(0, snake.combo - 1) * 0.15);
      const gained = Math.round(pellet.value * mult);
      snake.score += gained;
      snake.mass += pellet.mass;
      snake.foodEaten += 1;
      this.applyFood(snake, pellet.kind);
      this.pushFx('food', pellet.x, pellet.y, snake.playerId, gained, pellet.kind === 'normal' ? undefined : pellet.kind);
    }
    if (eaten.size) {
      this.snakeState.food = this.snakeState.food.filter((pellet) => !eaten.has(pellet.id));
    }
  }

  private applyFood(snake: Snake, kind: FoodKind): void {
    const until = this.now() + 4000;
    if (kind === 'speed') snake.effects.speedUntil = until;
    if (kind === 'shield') snake.effects.shieldUntil = until;
    if (kind === 'magnet') snake.effects.magnetUntil = until;
    if (kind === 'ghost') snake.effects.ghostUntil = this.now() + 3200;
    if (kind === 'multiplier') snake.effects.multiplierUntil = this.now() + 5000;
    if (kind === 'crystal' || kind === 'orb') snake.energy = Math.min(MAX_ENERGY, snake.energy + 18);
    if (kind === 'speed' || kind === 'shield' || kind === 'magnet' || kind === 'ghost' || kind === 'multiplier') {
      this.pushFx('power', snake.body[0].x, snake.body[0].y, snake.playerId, 0, kind);
    }
  }

  private pullFood(head: Point, radius: number): void {
    for (const pellet of this.foodGrid.query(head.x, head.y, radius)) {
      const dx = head.x - pellet.x;
      const dy = head.y - pellet.y;
      const dist = hypot(dx, dy);
      if (dist > 0 && dist < radius) {
        pellet.x += (dx / dist) * 3.4;
        pellet.y += (dy / dist) * 3.4;
      }
    }
  }

  private awardKill(killer: Snake, victim: Snake): void {
    killer.kills += 1;
    const bonus = this.snakeState.mode === 'battle' ? 750 : KILL_SCORE;
    const mult = this.now() < killer.effects.multiplierUntil ? 2 : 1;
    killer.score += bonus * mult;
    this.pushFx('kill', victim.body[0]?.x || 0, victim.body[0]?.y || 0, killer.playerId, bonus * mult);
  }

  private killSnake(snake: Snake, _killer: Snake | null): void {
    if (!snake.alive) return;
    snake.alive = false;
    snake.boosting = false;
    snake.combo = 0;
    this.pushFx('death', snake.body[0]?.x || 0, snake.body[0]?.y || 0, snake.playerId, Math.floor(snake.score));
    for (let i = 0; i < snake.body.length; i += 2) {
      const seg = snake.body[i];
      this.snakeState.food.push(this.makeFood('large', seg.x, seg.y, snake.color, 20, 1.2, 5.4));
    }
    snake.respawnAt = this.allowsRespawn() && !snake.isBoss ? this.now() + RESPAWN_MS : null;
  }

  private respawn(snake: Snake): void {
    const fresh = this.createSnake(snake.playerId, Math.floor(Math.random() * 18), {
      isBot: snake.isBot,
      botStyle: snake.botStyle,
      team: snake.team,
      skinId: snake.skinId,
      color: snake.color,
      name: snake.name,
    });
    snake.body = fresh.body;
    snake.trail = fresh.trail;
    snake.angle = fresh.angle;
    snake.targetAngle = fresh.targetAngle;
    snake.alive = true;
    snake.energy = MAX_ENERGY;
    snake.respawnAt = null;
    snake.effects = { speedUntil: 0, shieldUntil: 0, magnetUntil: 0, ghostUntil: 0, multiplierUntil: 0 };
    snake.combo = 0;
    snake.mass = 0;
    if (snake.isBot) {
      snake.score = Math.max(0, Math.floor(snake.score * 0.65));
    } else {
      snake.score = 0;
      snake.foodEaten = 0;
      snake.kills = 0;
      snake.survivedMs = 0;
    }
  }

  private awardSurvival(): void {
    if (this.snakeState.tickIndex % (1000 / SNAKE_TICK_MS) !== 0) return;
    for (const snake of this.snakeState.snakes) {
      if (!snake.alive) continue;
      snake.score += SURVIVAL_SCORE_PER_SEC;
    }
  }

  private makeFood(
    kind: FoodKind,
    x: number,
    y: number,
    color?: string,
    value?: number,
    mass?: number,
    r?: number
  ): Food {
    const vis = FOOD_VISUAL[kind];
    this.foodSeq += 1;
    return {
      id: `f${this.foodSeq}`,
      x: round1(x),
      y: round1(y),
      kind,
      value: value ?? vis.value,
      mass: mass ?? vis.mass,
      color: color ?? vis.color,
      r: r ?? vis.r,
    };
  }

  private spawnFood(count: number): void {
    for (let i = 0; i < count; i++) {
      const kind = pickKind();
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * (ARENA_RADIUS - 70);
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
    return [...pool].sort((a, b) => this.rankValue(b) - this.rankValue(a))[0]?.playerId ?? null;
  }

  private rankValue(snake: Snake): number {
    if (this.snakeState.mode === 'battle') return snake.kills * 10_000 + snake.score;
    return snake.score;
  }

  private startResults(): void {
    this.snakeState.phase = 'results';
    this.snakeState.resultsMs = 0;
    for (const snake of this.snakeState.snakes) {
      snake.boosting = false;
    }
  }

  private startNewRound(): void {
    this.snakeState.roundIndex += 1;
    this.snakeState.elapsedMs = 0;
    this.snakeState.countdownMs = this.settings.skipCountdown ? 0 : COUNTDOWN_MS;
    this.snakeState.phase = this.snakeState.countdownMs > 0 ? 'countdown' : 'playing';
    this.snakeState.resultsMs = 0;
    this.snakeState.food = [];
    this.foodSeq = 0;
    this.snakeState.snakes.forEach((snake, index) => {
      const fresh = this.createSnake(snake.playerId, index, {
        isBot: snake.isBot,
        botStyle: snake.botStyle,
        isBoss: snake.isBoss,
        team: snake.team,
        skinId: snake.skinId,
        color: snake.color,
        name: snake.name,
      });
      Object.assign(snake, fresh, { playerId: snake.playerId });
    });
    this.spawnFood(FOOD_TARGET);
  }

  private resolveEndCondition(): void {
    const { mode, elapsedMs, timeLimitMs, phase } = this.snakeState;
    if (phase !== 'playing') return;
    if (timeLimitMs && elapsedMs >= timeLimitMs) {
      this.startResults();
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

  private pushFx(kind: CoilFxEvent['kind'], x: number, y: number, playerId: string, value?: number, label?: string): void {
    this.fxSeq += 1;
    if (this.snakeState.events.length > 24) this.snakeState.events.shift();
    this.snakeState.events.push({
      id: `fx${this.fxSeq}`,
      kind,
      x: round1(x),
      y: round1(y),
      playerId,
      value,
      label,
    });
  }

  private compactSnake(snake: Snake) {
    const logical = snake.body.length;
    const pathDist = Math.max((logical - 1) * SPACING, 0);
    const netSpacing =
      logical > MAX_NET_BODY_POINTS && pathDist > 0
        ? pathDist / (MAX_NET_BODY_POINTS - 1)
        : SPACING;
    const sampled =
      netSpacing > SPACING + 0.01 ? samplePathByDistance(snake.body, netSpacing) : snake.body;
    const body = sampled.map((p) => ({ x: round1(p.x), y: round1(p.y) }));
    if (snake.body[0]) {
      body[0] = { x: round1(snake.body[0].x), y: round1(snake.body[0].y) };
    }
    return {
      playerId: snake.playerId,
      name: snake.name,
      body,
      length: logical,
      angle: round1(snake.angle),
      targetAngle: round1(snake.targetAngle),
      boosting: snake.boosting,
      alive: snake.alive,
      score: Math.floor(snake.score),
      mass: round1(snake.mass),
      kills: snake.kills,
      color: snake.color,
      radius: snake.radius,
      energy: Math.round(snake.energy),
      isBot: snake.isBot,
      botStyle: snake.botStyle,
      isBoss: snake.isBoss,
      team: snake.team,
      skinId: snake.skinId,
      foodEaten: snake.foodEaten,
      combo: snake.combo,
      effects: snake.effects,
      respawnAt: snake.respawnAt,
    };
  }

  private syncBoard(): void {
    this.snakeState.online = this.snakeState.snakes.filter((s) => !s.isBot).length;
    this.state.board = {
      mode: this.snakeState.mode,
      phase: this.snakeState.phase,
      worldSize: this.snakeState.worldSize,
      arenaRadius: this.snakeState.arenaRadius,
      origin: this.snakeState.origin,
      gridWidth: this.snakeState.gridWidth,
      gridHeight: this.snakeState.gridHeight,
      snakes: this.snakeState.snakes.map((s) => this.compactSnake(s)),
      food: this.snakeState.food.map((f) => ({
        id: f.id,
        x: round1(f.x),
        y: round1(f.y),
        value: f.value,
        color: f.color,
        r: f.r,
        kind: f.kind,
      })),
      tickRate: this.snakeState.tickRate,
      elapsedMs: this.snakeState.elapsedMs,
      timeLimitMs: this.snakeState.timeLimitMs,
      countdownMs: this.snakeState.countdownMs,
      resultsMs: this.snakeState.resultsMs,
      roundIndex: this.snakeState.roundIndex,
      tickIndex: this.snakeState.tickIndex,
      online: this.snakeState.online,
      events: this.snakeState.events,
    };
    this.state.metadata = {
      mode: this.snakeState.mode,
      phase: this.snakeState.phase,
      elapsedMs: this.snakeState.elapsedMs,
      timeLimitMs: this.snakeState.timeLimitMs,
      countdownMs: this.snakeState.countdownMs,
      roundIndex: this.snakeState.roundIndex,
      online: this.snakeState.online,
    };
  }
}
