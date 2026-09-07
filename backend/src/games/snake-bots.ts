import type { BotStyle } from './snake-types';

interface Point {
  x: number;
  y: number;
}

interface BotSnake {
  playerId: string;
  body: Point[];
  angle: number;
  targetAngle: number;
  boosting: boolean;
  alive: boolean;
  score: number;
  isBot?: boolean;
  botStyle?: BotStyle;
  isBoss?: boolean;
  energy: number;
}

interface BotWorld {
  origin: Point;
  arenaRadius: number;
  snakes: BotSnake[];
  food: Array<Point & { value: number }>;
}

const hypot = (x: number, y: number) => Math.hypot(x, y);

const normalize = (angle: number): number => {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const angleTo = (from: Point, to: Point) => Math.atan2(to.y - from.y, to.x - from.x);

const nearest = <T extends Point>(origin: Point, items: T[], skip?: (item: T) => boolean): T | null => {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const item of items) {
    if (skip?.(item)) continue;
    const d = hypot(item.x - origin.x, item.y - origin.y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best;
};

export const steerBot = (snake: BotSnake, world: BotWorld, tick: number): void => {
  if (!snake.alive) return;
  const head = snake.body[0];
  if (!head) return;

  const style = snake.botStyle || 'beginner';
  const center = world.origin;
  const edgeDist = world.arenaRadius - hypot(head.x - center.x, head.y - center.y);
  let target: Point | null = nearest(head, world.food);
  const threats = world.snakes.filter((other) => {
    if (!other.alive || other.playerId === snake.playerId) return false;
    const otherHead = other.body[0];
    return otherHead && hypot(otherHead.x - head.x, otherHead.y - head.y) < 140;
  });
  const prey = world.snakes
    .filter((other) => other.alive && other.playerId !== snake.playerId && other.body.length < snake.body.length)
    .sort((a, b) => hypot(a.body[0].x - head.x, a.body[0].y - head.y) - hypot(b.body[0].x - head.x, b.body[0].y - head.y))[0];

  if (style === 'random') {
    if (tick % 18 === 0) snake.targetAngle = snake.angle + (Math.random() - 0.5) * 1.6;
    snake.boosting = snake.energy > 40 && Math.random() < 0.02;
    return;
  }

  if ((style === 'defensive' || style === 'beginner' || edgeDist < 90) && edgeDist < 140) {
    snake.targetAngle = angleTo(head, center);
    snake.boosting = edgeDist < 70 && snake.energy > 20;
    return;
  }

  if ((style === 'hunter' || style === 'aggressive' || style === 'advanced' || snake.isBoss) && prey) {
    const preyHead = prey.body[0];
    const side = prey.body[Math.min(6, prey.body.length - 1)] || preyHead;
    target = style === 'hunter' || snake.isBoss ? side : preyHead;
  }

  if (style === 'defensive' && threats[0]?.body[0]) {
    const threat = threats[0].body[0];
    snake.targetAngle = normalize(angleTo(head, threat) + Math.PI);
    snake.boosting = snake.energy > 35;
    return;
  }

  if (target) {
    const jitter = style === 'beginner' ? (Math.random() - 0.5) * 0.7 : style === 'advanced' ? 0 : (Math.random() - 0.5) * 0.25;
    snake.targetAngle = normalize(angleTo(head, target) + jitter);
  }

  snake.boosting = Boolean(
    snake.energy > 45 &&
      ((style === 'aggressive' && !!prey && hypot(prey.body[0].x - head.x, prey.body[0].y - head.y) < 220) ||
        (style === 'advanced' && edgeDist < 110) ||
        (snake.isBoss && tick % 40 < 12))
  );
};
