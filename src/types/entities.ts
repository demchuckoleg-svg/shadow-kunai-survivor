/**
 * Контракты врагов, снарядов, зон, подбираемого и VFX.
 * Зависимости: ./core.
 */

import type { Entity, Faction } from './core';
import type { SkillId } from './skills';

/* ============================== Враги ============================== */

export type EnemyArchetypeId = 'genin' | 'assassin' | 'samurai' | 'archer' | 'miniBoss';

export type EnemyAI = 'chase' | 'strafeShoot' | 'charge' | 'boss';

export interface EnemyDefinition {
  archetype: EnemyArchetypeId;
  name: string;
  hp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  armor: number;
  xpValue: number;
  color: number;
  ai: EnemyAI;
  attackCooldown: number;
  projectileSpeed: number;
}

export interface WaveEntry {
  /** Начало окна в минутах от старта забега. */
  fromMinute: number;
  archetypes: readonly EnemyArchetypeId[];
  /** Врагов в секунду. */
  spawnRate: number;
  hpMultiplier: number;
  speedMultiplier: number;
}

export interface EnemyEntity extends Entity {
  archetype: EnemyArchetypeId;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  armor: number;
  xpValue: number;
  attackTimer: number;
  hitFlashTimer: number;
  stunTimer: number;
  slowFactor: number;
  slowTimer: number;
  freezeTimer: number;
  burnTimer: number;
  bleedTimer: number;
  marked: boolean;
  isElite: boolean;
}

/* ============================ Снаряды ============================= */

export type ProjectileKind =
  | 'kunai'
  | 'shuriken'
  | 'katanaWave'
  | 'senbon'
  | 'fireball'
  | 'iceShard'
  | 'needle'
  | 'soulFire'
  | 'phantomKunai'
  | 'cloneShot'
  | 'enemyArrow';

export interface ProjectileEntity extends Entity {
  kind: ProjectileKind;
  faction: Faction;
  sourceSkill: SkillId | null;
  damage: number;
  pierceLeft: number;
  ricochetLeft: number;
  homing: boolean;
  targetId: number;
  lastHitId: number;
  lifetime: number;
  maxLifetime: number;
  critChance: number;
  critMult: number;
  knockback: number;
  trailTimer: number;
  color: number;
  scale: number;
}

export interface OrbitalEntity extends Entity {
  skillId: SkillId;
  angle: number;
  orbitRadius: number;
  angularSpeed: number;
  damage: number;
  /** id врага -> остаток кулдауна повторного попадания. */
  hitCooldowns: Map<number, number>;
  color: number;
}

/* ========================= AoE-зоны =============================== */

export type ZoneKind = 'smoke' | 'lava' | 'spikes' | 'bambooWall' | 'vortex' | 'iceStorm';

export interface ZoneEntity extends Entity {
  kind: ZoneKind;
  skillId: SkillId;
  duration: number;
  tickTimer: number;
  tickInterval: number;
  damage: number;
  color: number;
  slowFactor: number;
  damageAmp: number;
}

/* ===================== Подбираемое и текст ======================== */

export type PickupKind = 'xp' | 'heal';

export interface PickupEntity extends Entity {
  kind: PickupKind;
  value: number;
  magnetized: boolean;
  lifetime: number;
  color: number;
}

export interface DamageTextEntity extends Entity {
  value: number;
  life: number;
  maxLife: number;
  crit: boolean;
  color: number;
  scale: number;
}

/* ============================== VFX =============================== */

export type VfxKind = 'slash' | 'explosion' | 'ring' | 'trail' | 'shockwave' | 'mark' | 'hitFlash';

export interface VfxEntity extends Entity {
  kind: VfxKind;
  life: number;
  maxLife: number;
  color: number;
  width: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rotation: number;
}
