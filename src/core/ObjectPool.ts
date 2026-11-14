/**
 * Универсальный пул объектов: никаких new/release в рантайме.
 * Зависимости: нет.
 */

export interface Poolable {
  id: number;
  active: boolean;
}

export type PoolFactory<T> = (id: number) => T;
export type PoolReset<T> = (item: T) => void;

export class ObjectPool<T extends Poolable> {
  readonly items: readonly T[];
  private readonly free: number[] = [];
  private readonly reset: PoolReset<T> | null;

  constructor(size: number, factory: PoolFactory<T>, reset?: PoolReset<T>) {
    if (size <= 0) {
      throw new Error('ObjectPool size must be > 0');
    }
    this.reset = reset ?? null;
    const items: T[] = new Array(size);
    for (let i = 0; i < size; i += 1) {
      const item = factory(i);
      item.id = i;
      item.active = false;
      items[i] = item;
      this.free.push(i);
    }
    this.items = items;
  }

  get capacity(): number {
    return this.items.length;
  }

  get activeCount(): number {
    return this.items.length - this.free.length;
  }

  get freeCount(): number {
    return this.free.length;
  }

  /** Берёт свободный объект. Возвращает null, если пул исчерпан. */
  acquire(): T | null {
    const index = this.free.pop();
    if (index === undefined) return null;
    const item = this.items[index];
    if (item === undefined) return null;
    item.active = true;
    return item;
  }

  release(item: T): void {
    if (!item.active) return;
    item.active = false;
    if (this.reset) this.reset(item);
    this.free.push(item.id);
  }

  forEachActive(cb: (item: T) => void): void {
    const items = this.items;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item !== undefined && item.active) cb(item);
    }
  }

  /** Освобождает все объекты (новый забег). */
  releaseAll(): void {
    this.free.length = 0;
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item !== undefined) {
        item.active = false;
        if (this.reset) this.reset(item);
        this.free.push(i);
      }
    }
  }

  /** Собирает активные объекты в переданный массив (без аллокаций). */
  collectActive(out: T[]): T[] {
    out.length = 0;
    this.forEachActive((item) => out.push(item));
    return out;
  }
}
