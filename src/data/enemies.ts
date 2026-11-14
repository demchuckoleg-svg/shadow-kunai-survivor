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
    color: 0x8b5cf6,
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
    color: 0xff2e4d,
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
    color: 0xffc94a,
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
    color: 0x35e6ff,
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
    color: 0xff7a1a,
    ai: 'boss',
    attackCooldown: 1.8,
    projectileSpeed: 190,
  },
};

/** Таблица волн по минутам; берётся последняя подходящая запись. */
export const WAVE_TABLE: readonly WaveEntry[] = [
  { fromMinute: 0, archetypes: ['genin'], spawnRate: 1.1, hpMultiplier: 1.0, speedMultiplier: 1.0 },
  {
    fromMinute: 2,
    archetypes: ['genin', 'assassin'],
    spawnRate: 1.5,
    hpMultiplier: 1.2,
    speedMultiplier: 1.05,
  },
  {
    fromMinute: 4,
    archetypes: ['genin', 'assassin', 'archer'],
    spawnRate: 1.8,
    hpMultiplier: 1.55,
    speedMultiplier: 1.1,
  },
  {
    fromMinute: 6,
    archetypes: ['genin', 'assassin', 'archer', 'samurai'],
    spawnRate: 2.1,
    hpMultiplier: 2.0,
    speedMultiplier: 1.15,
  },
  {
    fromMinute: 9,
    archetypes: ['assassin', 'archer', 'samurai'],
    spawnRate: 2.6,
    hpMultiplier: 2.7,
    speedMultiplier: 1.2,
  },
  {
    fromMinute: 12,
    archetypes: ['genin', 'assassin', 'archer', 'samurai'],
    spawnRate: 3.2,
    hpMultiplier: 3.6,
    speedMultiplier: 1.25,
  },
];

export function getWaveForMinute(minute: number): WaveEntry {
  let wave = WAVE_TABLE[0];
  if (!wave) throw new Error('WAVE_TABLE is empty');
  for (const entry of WAVE_TABLE) {
    if (minute >= entry.fromMinute) wave = entry;
  }
  return wave;
}

export const BOSS_INTERVAL_SECONDS = 180;
export const MAX_ENEMIES_ALIVE = 420;
