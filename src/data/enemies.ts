import type { EnemyArchetypeId, EnemyDefinition, WaveEntry } from '@/types/game';

export const ENEMY_DEFINITIONS: Readonly<Record<EnemyArchetypeId, EnemyDefinition>> = {
  genin: {
    archetype: 'genin',
    name: 'Генин',
    hp: 18,
    speed: 62,
    contactDamage: 6,
    radius: 14,
    armor: 0,
    xpValue: 1,
    color: 0x8d99ae,
    ai: 'chase',
    attackCooldown: 0.9,
    projectileSpeed: 0,
  },
  assassin: {
    archetype: 'assassin',
    name: 'Ассасин',
    hp: 12,
    speed: 126,
    contactDamage: 8,
    radius: 11,
    armor: 0,
    xpValue: 1,
    color: 0xe63946,
    ai: 'charge',
    attackCooldown: 0.7,
    projectileSpeed: 0,
  },
  samurai: {
    archetype: 'samurai',
    name: 'Самурай',
    hp: 58,
    speed: 46,
    contactDamage: 12,
    radius: 19,
    armor: 2,
    xpValue: 2,
    color: 0xd4af37,
    ai: 'chase',
    attackCooldown: 1.0,
    projectileSpeed: 0,
  },
  archer: {
    archetype: 'archer',
    name: 'Лучник',
    hp: 20,
    speed: 58,
    contactDamage: 4,
    radius: 13,
    armor: 0,
    xpValue: 2,
    color: 0x2ec4b6,
    ai: 'strafeShoot',
    attackCooldown: 2.2,
    projectileSpeed: 240,
  },
  miniBoss: {
    archetype: 'miniBoss',
    name: 'Они-Страж',
    hp: 620,
    speed: 42,
    contactDamage: 20,
    radius: 34,
    armor: 4,
    xpValue: 25,
    color: 0x8d99ae,
    ai: 'boss',
    attackCooldown: 1.8,
    projectileSpeed: 190,
  },
};

/** Composition windows; spawn rate and HP scaling are exponential functions below. */
export const WAVE_TABLE: readonly WaveEntry[] = [
  { fromMinute: 0, archetypes: ['genin'] },
  { fromMinute: 2, archetypes: ['genin', 'assassin'] },
  { fromMinute: 4, archetypes: ['genin', 'assassin', 'archer'] },
  { fromMinute: 6, archetypes: ['genin', 'assassin', 'archer', 'samurai'] },
  { fromMinute: 10, archetypes: ['assassin', 'archer', 'samurai', 'genin'] },
  { fromMinute: 15, archetypes: ['assassin', 'archer', 'samurai'] },
  { fromMinute: 20, archetypes: ['genin', 'assassin', 'archer', 'samurai'] },
];

export function getWaveForMinute(minute: number): WaveEntry {
  let wave = WAVE_TABLE[0];
  if (!wave) throw new Error('WAVE_TABLE is empty');
  for (const entry of WAVE_TABLE) {
    if (minute >= entry.fromMinute) wave = entry;
  }
  return wave;
}

export const BOSS_INTERVAL_SECONDS = 150;
export const MAX_ENEMIES_ALIVE = 1100;
export const MAX_SPAWNS_PER_FRAME = 30;

/** Exponential horde pressure: ~1.1/s at start, ~8/s at 5 min, ~21/s at 10 min. */
export function getSpawnRate(elapsed: number): number {
  const t = Math.max(0, elapsed);
  return 1.1 + 0.02 * t + 0.55 * (Math.exp(t / 210) - 1);
}

/** Exponential HP: ~5x at 5 min, ~24x at 10 min, ~106x at 15 min. */
export function getHpMultiplier(elapsed: number): number {
  const t = Math.max(0, elapsed);
  return Math.exp(t / 240) * (1 + t / 600);
}

export function getSpeedMultiplier(elapsed: number): number {
  return 1 + Math.min(0.6, Math.max(0, elapsed) / 1500);
}

export function getDamageMultiplier(elapsed: number): number {
  return 1 + Math.min(2, Math.max(0, elapsed) / 900);
}

export function getEliteChance(elapsed: number): number {
  return Math.min(0.18, 0.015 + Math.max(0, elapsed) / 4000);
}

export function getXpMultiplier(elapsed: number): number {
  return Math.min(12, 1 + Math.max(0, elapsed) / 120);
}
