/**
 * Фабрики и reset-функции для пулов. Вызываются только на старте/при release.
 * Зависимости: @/types/game.
 */

import type {
  DamageTextEntity,
  EnemyEntity,
  OrbitalEntity,
  PickupEntity,
  ProjectileEntity,
  VfxEntity,
  ZoneEntity,
} from '@/types/game';

export const createEnemyEntity = (id: number): EnemyEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 14,
  archetype: 'genin',
  hp: 1,
  maxHp: 1,
  speed: 0,
  damage: 0,
  armor: 0,
  xpValue: 1,
  attackTimer: 0,
  hitFlashTimer: 0,
  stunTimer: 0,
  slowFactor: 1,
  slowTimer: 0,
  freezeTimer: 0,
  burnTimer: 0,
  bleedTimer: 0,
  marked: false,
  isElite: false,
});

export const resetEnemyEntity = (enemy: EnemyEntity): void => {
  enemy.x = 0;
  enemy.y = 0;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.hp = 0;
  enemy.attackTimer = 0;
  enemy.hitFlashTimer = 0;
  enemy.stunTimer = 0;
  enemy.slowFactor = 1;
  enemy.slowTimer = 0;
  enemy.freezeTimer = 0;
  enemy.burnTimer = 0;
  enemy.bleedTimer = 0;
  enemy.marked = false;
  enemy.isElite = false;
};

export const createProjectileEntity = (id: number): ProjectileEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 6,
  kind: 'kunai',
  faction: 'player',
  sourceSkill: null,
  damage: 1,
  pierceLeft: 0,
  ricochetLeft: 0,
  homing: false,
  targetId: -1,
  lastHitId: -1,
  lifetime: 2,
  maxLifetime: 2,
  critChance: 0,
  critMult: 1.5,
  knockback: 0,
  trailTimer: 0,
  color: 0xffffff,
  scale: 1,
});

export const resetProjectileEntity = (projectile: ProjectileEntity): void => {
  projectile.vx = 0;
  projectile.vy = 0;
  projectile.targetId = -1;
  projectile.lastHitId = -1;
  projectile.homing = false;
  projectile.pierceLeft = 0;
  projectile.ricochetLeft = 0;
  projectile.trailTimer = 0;
};

export const createPickupEntity = (id: number): PickupEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 7,
  kind: 'xp',
  value: 1,
  magnetized: false,
  lifetime: 35,
  color: 0x35e6ff,
});

export const resetPickupEntity = (pickup: PickupEntity): void => {
  pickup.magnetized = false;
  pickup.vx = 0;
  pickup.vy = 0;
  pickup.value = 0;
};

export const createDamageTextEntity = (id: number): DamageTextEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: -34,
  radius: 0,
  value: 0,
  life: 0,
  maxLife: 0.75,
  crit: false,
  color: 0xffffff,
  scale: 1,
});

export const resetDamageTextEntity = (text: DamageTextEntity): void => {
  text.life = 0;
  text.value = 0;
  text.vx = 0;
  text.vy = 0;
};

export const createVfxEntity = (id: number): VfxEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 12,
  kind: 'explosion',
  life: 0,
  maxLife: 0.3,
  color: 0xffffff,
  width: 3,
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  rotation: 0,
});

export const resetVfxEntity = (vfx: VfxEntity): void => {
  vfx.life = 0;
  vfx.width = 3;
  vfx.rotation = 0;
};

export const createZoneEntity = (id: number): ZoneEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 48,
  kind: 'smoke',
  skillId: 'smoke',
  duration: 1,
  tickTimer: 0,
  tickInterval: 0.25,
  damage: 1,
  color: 0x9be15d,
  slowFactor: 1,
  damageAmp: 1,
});

export const resetZoneEntity = (zone: ZoneEntity): void => {
  zone.duration = 0;
  zone.tickTimer = 0;
  zone.slowFactor = 1;
  zone.damageAmp = 1;
};

export const createOrbitalEntity = (id: number): OrbitalEntity => ({
  id,
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 12,
  skillId: 'shuriken',
  angle: 0,
  orbitRadius: 90,
  angularSpeed: 3,
  damage: 1,
  hitCooldowns: new Map<number, number>(),
  color: 0xbfefff,
});

export const resetOrbitalEntity = (orbital: OrbitalEntity): void => {
  orbital.angle = 0;
  orbital.hitCooldowns.clear();
};
