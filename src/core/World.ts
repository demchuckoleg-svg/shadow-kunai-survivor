/**
 * Владелец всех пулов и пространственной сетки врагов.
 * Зависимости: @/types/game, ObjectPool, SpatialGrid, entityFactories.
 */

import type {
  DamageTextEntity,
  EnemyDefinition,
  EnemyEntity,
  Faction,
  PickupEntity,
  PickupKind,
  ProjectileEntity,
  ProjectileKind,
  SkillId,
  VfxEntity,
  VfxKind,
  ZoneEntity,
  ZoneKind,
  OrbitalEntity,
} from '@/types/game';
import { DEFAULT_POOL_SIZES, GRID_CELL_SIZE } from '@/types/game';
import { ObjectPool } from './ObjectPool';
import { SpatialGrid } from './SpatialGrid';
import {
  createDamageTextEntity,
  createEnemyEntity,
  createOrbitalEntity,
  createPickupEntity,
  createProjectileEntity,
  createVfxEntity,
  createZoneEntity,
  resetDamageTextEntity,
  resetEnemyEntity,
  resetOrbitalEntity,
  resetPickupEntity,
  resetProjectileEntity,
  resetVfxEntity,
  resetZoneEntity,
} from './entityFactories';

export interface ProjectileSpawn {
  kind: ProjectileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  faction?: Faction;
  sourceSkill?: SkillId | null;
  pierce?: number;
  ricochet?: number;
  homing?: boolean;
  targetId?: number;
  lifetime?: number;
  color?: number;
  radius?: number;
  critChance?: number;
  critMult?: number;
  knockback?: number;
  scale?: number;
  explodeRadius?: number;
  explodeZone?: ZoneKind | null;
  explodeChildren?: number;
  freezeDuration?: number;
}

export interface VfxSpawn {
  kind: VfxKind;
  x: number;
  y: number;
  color?: number;
  life?: number;
  radius?: number;
  width?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  rotation?: number;
}

export interface OrbitalSpawn {
  skillId: SkillId;
  angle: number;
  orbitRadius: number;
  angularSpeed: number;
  damage: number;
  radius: number;
  color?: number;
  knockback?: number;
  launchOnCrit?: boolean;
}

export interface ZoneSpawn {
  kind: ZoneKind;
  skillId: SkillId;
  x: number;
  y: number;
  radius: number;
  duration: number;
  damage: number;
  color?: number;
  tickInterval?: number;
  slowFactor?: number;
  damageAmp?: number;
}

const XP_MERGE_RADIUS = 260;
const MAX_XP_ORBS = 150;

export class World {
  readonly enemies = new ObjectPool<EnemyEntity>(
    DEFAULT_POOL_SIZES.enemies,
    createEnemyEntity,
    resetEnemyEntity,
  );
  readonly projectiles = new ObjectPool<ProjectileEntity>(
    DEFAULT_POOL_SIZES.projectiles,
    createProjectileEntity,
    resetProjectileEntity,
  );
  readonly pickups = new ObjectPool<PickupEntity>(
    DEFAULT_POOL_SIZES.pickups,
    createPickupEntity,
    resetPickupEntity,
  );
  readonly damageTexts = new ObjectPool<DamageTextEntity>(
    DEFAULT_POOL_SIZES.damageTexts,
    createDamageTextEntity,
    resetDamageTextEntity,
  );
  readonly vfx = new ObjectPool<VfxEntity>(
    DEFAULT_POOL_SIZES.vfx,
    createVfxEntity,
    resetVfxEntity,
  );
  readonly zones = new ObjectPool<ZoneEntity>(
    DEFAULT_POOL_SIZES.zones,
    createZoneEntity,
    resetZoneEntity,
  );
  readonly orbitals = new ObjectPool<OrbitalEntity>(
    DEFAULT_POOL_SIZES.orbitals,
    createOrbitalEntity,
    resetOrbitalEntity,
  );

  readonly enemyGrid = new SpatialGrid<EnemyEntity>(GRID_CELL_SIZE);
  /** Переиспользуемые буферы запросов (без аллокаций в бою). */
  readonly enemyQuery: EnemyEntity[] = [];
  readonly enemySnapshot: EnemyEntity[] = [];

  reset(): void {
    this.enemies.releaseAll();
    this.projectiles.releaseAll();
    this.pickups.releaseAll();
    this.damageTexts.releaseAll();
    this.vfx.releaseAll();
    this.zones.releaseAll();
    this.orbitals.releaseAll();
    this.enemyGrid.clear();
  }

  rebuildEnemyGrid(): void {
    this.enemies.collectActive(this.enemySnapshot);
    this.enemyGrid.rebuild(this.enemySnapshot);
  }

  getEnemyById(id: number): EnemyEntity | null {
    if (id < 0 || id >= this.enemies.items.length) return null;
    const enemy = this.enemies.items[id];
    return enemy !== undefined && enemy.active ? enemy : null;
  }

  spawnEnemy(
    def: EnemyDefinition,
    x: number,
    y: number,
    hpMultiplier = 1,
    speedMultiplier = 1,
    isElite = false,
  ): EnemyEntity | null {
    const enemy = this.enemies.acquire();
    if (!enemy) return null;
    const hp = Math.round(def.hp * hpMultiplier * (isElite ? 2.2 : 1));
    enemy.archetype = def.archetype;
    enemy.x = x;
    enemy.y = y;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.radius = def.radius * (isElite ? 1.25 : 1);
    enemy.hp = hp;
    enemy.maxHp = hp;
    enemy.speed = def.speed * speedMultiplier;
    enemy.damage = def.contactDamage * (isElite ? 1.5 : 1);
    enemy.armor = def.armor;
    enemy.xpValue = def.xpValue;
    enemy.attackTimer = Math.random() * def.attackCooldown;
    enemy.isElite = isElite;
    enemy.hitFlashTimer = 0;
    enemy.stunTimer = 0;
    enemy.slowFactor = 1;
    enemy.slowTimer = 0;
    enemy.freezeTimer = 0;
    enemy.burnTimer = 0;
    enemy.bleedTimer = 0;
    enemy.marked = false;
    return enemy;
  }

  spawnProjectile(opts: ProjectileSpawn): ProjectileEntity | null {
    const projectile = this.projectiles.acquire();
    if (!projectile) return null;
    projectile.kind = opts.kind;
    projectile.x = opts.x;
    projectile.y = opts.y;
    projectile.vx = opts.vx;
    projectile.vy = opts.vy;
    projectile.damage = opts.damage;
    projectile.faction = opts.faction ?? 'player';
    projectile.sourceSkill = opts.sourceSkill ?? null;
    projectile.pierceLeft = opts.pierce ?? 0;
    projectile.ricochetLeft = opts.ricochet ?? 0;
    projectile.homing = opts.homing ?? false;
    projectile.targetId = opts.targetId ?? -1;
    projectile.lastHitId = -1;
    projectile.lifetime = opts.lifetime ?? 2;
    projectile.maxLifetime = projectile.lifetime;
    projectile.color = opts.color ?? 0xffffff;
    projectile.radius = opts.radius ?? 7;
    projectile.critChance = opts.critChance ?? 0;
    projectile.critMult = opts.critMult ?? 1.5;
    projectile.knockback = opts.knockback ?? 0;
    projectile.trailTimer = 0;
    projectile.scale = opts.scale ?? 1;
    projectile.explodeRadius = opts.explodeRadius ?? 0;
    projectile.explodeZone = opts.explodeZone ?? null;
    projectile.explodeChildren = opts.explodeChildren ?? 0;
    projectile.freezeDuration = opts.freezeDuration ?? 0;
    return projectile;
  }

  spawnVfx(opts: VfxSpawn): VfxEntity | null {
    const vfx = this.vfx.acquire();
    if (!vfx) return null;
    vfx.kind = opts.kind;
    vfx.x = opts.x;
    vfx.y = opts.y;
    vfx.fromX = opts.fromX ?? opts.x;
    vfx.fromY = opts.fromY ?? opts.y;
    vfx.toX = opts.toX ?? opts.x;
    vfx.toY = opts.toY ?? opts.y;
    vfx.rotation = opts.rotation ?? 0;
    vfx.color = opts.color ?? 0xffffff;
    vfx.life = opts.life ?? 0.3;
    vfx.maxLife = vfx.life;
    vfx.radius = opts.radius ?? 12;
    vfx.width = opts.width ?? 3;
    return vfx;
  }

  spawnOrbital(opts: OrbitalSpawn): OrbitalEntity | null {
    const orbital = this.orbitals.acquire();
    if (!orbital) return null;
    orbital.skillId = opts.skillId;
    orbital.angle = opts.angle;
    orbital.orbitRadius = opts.orbitRadius;
    orbital.angularSpeed = opts.angularSpeed;
    orbital.damage = opts.damage;
    orbital.radius = opts.radius;
    orbital.color = opts.color ?? 0xbfefff;
    orbital.knockback = opts.knockback ?? 0;
    orbital.launchOnCrit = opts.launchOnCrit ?? false;
    orbital.x = 0;
    orbital.y = 0;
    return orbital;
  }

  spawnZone(opts: ZoneSpawn): ZoneEntity | null {
    const zone = this.zones.acquire();
    if (!zone) return null;
    zone.kind = opts.kind;
    zone.skillId = opts.skillId;
    zone.x = opts.x;
    zone.y = opts.y;
    zone.radius = opts.radius;
    zone.duration = opts.duration;
    zone.damage = opts.damage;
    zone.color = opts.color ?? 0x9be15d;
    zone.tickInterval = opts.tickInterval ?? 0.25;
    zone.tickTimer = 0;
    zone.slowFactor = opts.slowFactor ?? 1;
    zone.damageAmp = opts.damageAmp ?? 1;
    return zone;
  }

  spawnDamageText(x: number, y: number, value: number, crit: boolean, color = 0xffffff): void {
    const text = this.damageTexts.acquire();
    if (!text) return;
    text.x = x + (Math.random() * 12 - 6);
    text.y = y - 8;
    text.value = value;
    text.crit = crit;
    text.color = crit ? 0xffc94a : color;
    text.scale = crit ? 1.45 : 1;
    text.life = text.maxLife;
    text.vx = Math.random() * 20 - 10;
    text.vy = crit ? -58 : -38;
  }

  spawnPickup(kind: PickupKind, x: number, y: number, value: number, color?: number): PickupEntity | null {
    const pickup = this.pickups.acquire();
    if (!pickup) return null;
    pickup.kind = kind;
    pickup.x = x;
    pickup.y = y;
    pickup.vx = Math.random() * 60 - 30;
    pickup.vy = Math.random() * 60 - 30;
    pickup.value = value;
    pickup.magnetized = false;
    pickup.lifetime = 35;
    pickup.radius = kind === 'heal' ? 9 : 7;
    pickup.color = color ?? (kind === 'heal' ? 0xff6b8a : 0x35e6ff);
    return pickup;
  }

  /** XP с магнитным слиянием: при >150 сфер опыт идёт в ближайшую. */
  dropXp(x: number, y: number, value: number): void {
    const merge = { count: 0, target: null as PickupEntity | null };
    let nearestDist = XP_MERGE_RADIUS * XP_MERGE_RADIUS;
    this.pickups.forEachActive((pickup) => {
      if (pickup.kind !== 'xp') return;
      merge.count += 1;
      const dx = pickup.x - x;
      const dy = pickup.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        merge.target = pickup;
      }
    });
    if (merge.count >= MAX_XP_ORBS && merge.target) {
      merge.target.value += value;
      return;
    }
    this.spawnPickup('xp', x, y, value);
  }
}
