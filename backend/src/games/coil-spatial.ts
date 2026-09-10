interface SpatialItem {
  x: number;
  y: number;
}

export class SpatialHash<T extends SpatialItem> {
  private readonly cellSize: number;
  private readonly cells = new Map<string, T[]>();

  constructor(cellSize = 80) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(item: T): void {
    const key = this.key(item.x, item.y);
    const bucket = this.cells.get(key);
    if (bucket) bucket.push(item);
    else this.cells.set(key, [item]);
  }

  query(x: number, y: number, radius: number): T[] {
    const found: T[] = [];
    const minC = Math.floor((x - radius) / this.cellSize);
    const maxC = Math.floor((x + radius) / this.cellSize);
    const minR = Math.floor((y - radius) / this.cellSize);
    const maxR = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;
    for (let cx = minC; cx <= maxC; cx++) {
      for (let cy = minR; cy <= maxR; cy++) {
        const bucket = this.cells.get(`${cx}:${cy}`);
        if (!bucket) continue;
        for (const item of bucket) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) found.push(item);
        }
      }
    }
    return found;
  }

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)}:${Math.floor(y / this.cellSize)}`;
  }
}
