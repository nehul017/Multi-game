import { GameEngine } from './engine';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface Snake {
  playerId: string;
  body: Point[];
  direction: Direction;
  alive: boolean;
  score: number;
  color: string;
}

interface SnakeGameState {
  gridWidth: number;
  gridHeight: number;
  snakes: Snake[];
  food: Point[];
  tickRate: number;
}

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

export class SnakeMultiplayer extends GameEngine {
  private snakeState: SnakeGameState;

  constructor(players: string[]) {
    super(players);
    this.snakeState = {
      gridWidth: 30,
      gridHeight: 30,
      snakes: [],
      food: [],
      tickRate: 150,
    };
    this.initGame();
  }

  initGame(): void {
    const startPositions = [
      { x: 5, y: 5, dir: 'right' as Direction },
      { x: 24, y: 24, dir: 'left' as Direction },
      { x: 24, y: 5, dir: 'down' as Direction },
      { x: 5, y: 24, dir: 'up' as Direction },
    ];

    this.snakeState.snakes = this.state.players.map((playerId, index) => {
      const start = startPositions[index % startPositions.length];
      return {
        playerId,
        body: [
          { x: start.x, y: start.y },
          { x: start.x - (start.dir === 'right' ? 1 : start.dir === 'left' ? -1 : 0),
            y: start.y - (start.dir === 'down' ? 1 : start.dir === 'up' ? -1 : 0) },
          { x: start.x - (start.dir === 'right' ? 2 : start.dir === 'left' ? -2 : 0),
            y: start.y - (start.dir === 'down' ? 2 : start.dir === 'up' ? -2 : 0) },
        ],
        direction: start.dir,
        alive: true,
        score: 0,
        color: COLORS[index % COLORS.length],
      };
    });

    this.spawnFood(3);
    this.state.board = this.snakeState;
    this.state.status = 'playing';
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;

    const direction = move.direction as Direction;
    if (!['up', 'down', 'left', 'right'].includes(direction)) return false;

    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake || !snake.alive) return false;

    const opposites: Record<Direction, Direction> = {
      up: 'down', down: 'up', left: 'right', right: 'left',
    };
    return direction !== opposites[snake.direction];
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake) return false;

    snake.direction = move.direction as Direction;
    this.addMoveToHistory(player, 'direction', { direction: snake.direction });

    return true;
  }

  tick(): void {
    if (this.isGameOver()) return;

    for (const snake of this.snakeState.snakes) {
      if (!snake.alive) continue;

      const head = { ...snake.body[0] };

      switch (snake.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      if (head.x < 0 || head.x >= this.snakeState.gridWidth ||
          head.y < 0 || head.y >= this.snakeState.gridHeight) {
        snake.alive = false;
        continue;
      }

      const hitSelf = snake.body.some((seg) => seg.x === head.x && seg.y === head.y);
      const hitOther = this.snakeState.snakes
        .filter((s) => s.playerId !== snake.playerId && s.alive)
        .some((s) => s.body.some((seg) => seg.x === head.x && seg.y === head.y));

      if (hitSelf || hitOther) {
        snake.alive = false;
        continue;
      }

      snake.body.unshift(head);

      const foodIndex = this.snakeState.food.findIndex((f) => f.x === head.x && f.y === head.y);
      if (foodIndex >= 0) {
        this.snakeState.food.splice(foodIndex, 1);
        snake.score += 10;
        this.spawnFood(1);
      } else {
        snake.body.pop();
      }
    }

    this.state.board = this.snakeState;

    const aliveSnakes = this.snakeState.snakes.filter((s) => s.alive);
    if (aliveSnakes.length <= 1) {
      if (aliveSnakes.length === 1) {
        this.endGame(aliveSnakes[0].playerId);
      } else {
        this.endGame(null);
      }
    }
  }

  checkWin(): string | null {
    const aliveSnakes = this.snakeState.snakes.filter((s) => s.alive);
    if (aliveSnakes.length === 1 && this.snakeState.snakes.length > 1) {
      return aliveSnakes[0].playerId;
    }
    return null;
  }

  checkDraw(): boolean {
    return this.snakeState.snakes.filter((s) => s.alive).length === 0;
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    const snake = this.snakeState.snakes.find((s) => s.playerId === player);
    if (!snake || !snake.alive) return [];

    const all: Direction[] = ['up', 'down', 'left', 'right'];
    const opposites: Record<Direction, Direction> = {
      up: 'down', down: 'up', left: 'right', right: 'left',
    };

    return all
      .filter((d) => d !== opposites[snake.direction])
      .map((d) => ({ direction: d }));
  }

  private spawnFood(count: number): void {
    const occupied = new Set<string>();
    for (const snake of this.snakeState.snakes) {
      for (const seg of snake.body) {
        occupied.add(`${seg.x},${seg.y}`);
      }
    }
    for (const food of this.snakeState.food) {
      occupied.add(`${food.x},${food.y}`);
    }

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts < 100) {
        const x = Math.floor(Math.random() * this.snakeState.gridWidth);
        const y = Math.floor(Math.random() * this.snakeState.gridHeight);
        const key = `${x},${y}`;
        if (!occupied.has(key)) {
          this.snakeState.food.push({ x, y });
          occupied.add(key);
          break;
        }
        attempts++;
      }
    }
  }
}
