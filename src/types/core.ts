/**
 * Базовые контракты мира и игрока.
 * Зависимости: нет.
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** База для любого объекта из ObjectPool. */
export interface Entity {
  id: number;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export type Faction = 'player' | 'enemy' | 'neutral';

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface InputState {
  /** Нормализованный вектор движения, -1..1. */
  moveX: number;
  moveY: number;
  active: boolean;
  pointerId: number;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
}

export interface PlayerState extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  /** 1..50 */
  level: number;
  xp: number;
  nextLevelXp: number;
  pickupRadius: number;
  critChance: number;
  critMult: number;
  armor: number;
  /** 0..100 */
  ultCharge: number;
  ultUnlocked: boolean;
  /** Кулдаун i-frames после урона, сек. */
  invulnTimer: number;
  /** Временный бафф скорости (рывок), сек. */
  speedBoostTimer: number;
  /** Длительность баффа скорости атаки (берсерк), сек. */
  attackSpeedBuffTimer: number;
  facingX: number;
  facingY: number;
  alive: boolean;
}

/** Предвыделенные размеры пулов. */
export interface PoolSizes {
  enemies: number;
  projectiles: number;
  pickups: number;
  damageTexts: number;
  vfx: number;
  zones: number;
  orbitals: number;
}

export const DEFAULT_POOL_SIZES: PoolSizes = {
  enemies: 1800,
  projectiles: 1400,
  pickups: 400,
  damageTexts: 220,
  vfx: 700,
  zones: 100,
  orbitals: 60,
};

/** Фиксированный шаг симуляции: 60 Гц. */
export const FIXED_DT = 1 / 60;
/** Размер ячейки SpatialGrid, px. */
export const GRID_CELL_SIZE = 128;
