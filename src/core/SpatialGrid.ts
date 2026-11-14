/**
 * Пространственная хеш-сетка 128×128 px: колизии только в соседних ячейках.
 * Зависимости: нет.
 */

export interface GridItem {
  id: number;
  active: boolean;
  x: number;
  y: number;
  radius: number;
}

const HASH_BIAS = 1 << 15;

export class SpatialGrid<T extends GridItem> {
  readonly cellSize: number;
  private readonly cells = new Map<number, T[]>();
  private readonly usedKeys: number[] = [];

  constructor(cellSize = 128) {
    this.cellSize = cellSize;
  }

  private key(cellX: number, cellY: number): number {
    // Безопасно для отрицательных координат: (cellX << 16) ^ cellY со сдвигом.
    return ((cellX + HASH_BIAS) << 16) ^ (cellY + HASH_BIAS);
  }

  private cellCoord(value: number): number {
    return Math.floor(value / this.cellSize);
  }

  clear(): void {
    for (let i = 0; i < this.usedKeys.length; i += 1) {
      const key = this.usedKeys[i];
      if (key === undefined) continue;
      const bucket = this.cells.get(key);
      if (bucket) bucket.length = 0;
    }
    this.usedKeys.length = 0;
  }

  insert(item: T): void {
    const cx = this.cellCoord(item.x);
    const cy = this.cellCoord(item.y);
    const key = this.key(cx, cy);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    if (bucket.length === 0) this.usedKeys.push(key);
    bucket.push(item);
  }

  rebuild(items: Iterable<T>): void {
    this.clear();
    for (const item of items) {
      if (item.active) this.insert(item);
    }
  }

  /** Все активные объекты в круге (без дублей: объект лежит ровно в одной ячейке). */
  queryCircle(x: number, y: number, radius: number, out: T[]): T[] {
    out.length = 0;
    const minX = this.cellCoord(x - radius);
    const maxX = this.cellCoord(x + radius);
    const minY = this.cellCoord(y - radius);
    const maxY = this.cellCoord(y + radius);
    const r2 = radius * radius;

    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i += 1) {
          const item = bucket[i];
          if (item === undefined || !item.active) continue;
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) out.push(item);
        }
      }
    }
    return out;
  }

  /** Ближайший объект в радиусе (для самонаводки/рикошетов). */
  nearest(x: number, y: number, maxRadius: number, excludeId = -1): T | null {
    const minX = this.cellCoord(x - maxRadius);
    const maxX = this.cellCoord(x + maxRadius);
    const minY = this.cellCoord(y - maxRadius);
    const maxY = this.cellCoord(y + maxRadius);
    let best: T | null = null;
    let bestDist = maxRadius * maxRadius;

    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i += 1) {
          const item = bucket[i];
          if (item === undefined || !item.active || item.id === excludeId) continue;
          const dx = item.x - x;
          const dy = item.y - y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            best = item;
          }
        }
      }
    }
    return best;
  }

  /** Клетки с непустыми корзинами — для отладочной отрисовки. */
  forEachOccupiedCell(cb: (cellX: number, cellY: number, count: number) => void): void {
    for (const key of this.usedKeys) {
      const bucket = this.cells.get(key);
      if (!bucket || bucket.length === 0) continue;
      const cx = (key >>> 16) - HASH_BIAS;
      const cy = (key & 0xffff) - HASH_BIAS;
      cb(cx, cy, bucket.length);
    }
  }

  get cellCount(): number {
    return this.usedKeys.length;
  }
}
