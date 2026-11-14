/**
 * Движение снарядов, самонаводка, рикошеты, AoE-зоны и орбиталы.
 * Зависимости: GameState, World, CombatSystem, PlayerSystem.
 */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type {
  EnemyEntity,
  OrbitalEntity,
  ProjectileEntity,
  ZoneEntity,
} from '@/types/game';
import type { CombatSystem } from './CombatSystem';
import type { PlayerSystem } from './PlayerSystem';

const HOMING_TURN_RATE = 5.5;
const ORBITAL_HIT_COOLDOWN = 0.25;
const TRAIL_INTERVAL = 0.05;

export class ProjectileSystem {
  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly combat: CombatSystem,
    private readonly playerSystem: PlayerSystem,
  ) {}

  update(dt: number): void {
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateOrbitals(dt);
  }

  private updateProjectiles(dt: number): void {
    this.world.projectiles.forEachActive((projectile) => {
      projectile.lifetime -= dt;
      if (projectile.lifetime <= 0) {
        this.world.projectiles.release(projectile);
        return;
      }

      if (projectile.homing) this.steer(projectile, dt);

      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      this.emitTrail(projectile, dt);

      if (projectile.faction === 'enemy') {
        this.hitPlayer(projectile);
        return;
      }
      this.hitEnemies(projectile);
    });
  }

  private steer(projectile: ProjectileEntity, dt: number): void {
    const target =
      projectile.targetId >= 0
        ? this.world.getEnemyById(projectile.targetId)
        : this.world.enemyGrid.nearest(projectile.x, projectile.y, 420, projectile.lastHitId);
    if (!target) return;
    projectile.targetId = target.id;

    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const desired = Math.atan2(target.y - projectile.y, target.x - projectile.x);
    let current = Math.atan2(projectile.vy, projectile.vx);
    let delta = desired - current;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const maxTurn = HOMING_TURN_RATE * dt;
    current += Math.max(-maxTurn, Math.min(maxTurn, delta));
    projectile.vx = Math.cos(current) * speed;
    projectile.vy = Math.sin(current) * speed;
  }

  private emitTrail(projectile: ProjectileEntity, dt: number): void {
    if (projectile.faction !== 'player') return;
    projectile.trailTimer -= dt;
    if (projectile.trailTimer > 0) return;
    projectile.trailTimer = TRAIL_INTERVAL;
    this.world.spawnVfx({
      kind: 'trail',
      x: projectile.x,
      y: projectile.y,
      color: projectile.color,
      life: 0.14,
      radius: Math.max(2, projectile.radius * 0.8),
      width: 2,
    });
  }

  private hitPlayer(projectile: ProjectileEntity): void {
    const player = this.state.player;
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    const reach = projectile.radius + player.radius;
    if (dx * dx + dy * dy > reach * reach) return;

    if (!this.state.ultimate.active) this.playerSystem.damage(projectile.damage);
    this.world.spawnVfx({
      kind: 'explosion',
      x: projectile.x,
      y: projectile.y,
      color: projectile.color,
      life: 0.2,
      radius: 18,
      width: 2,
    });
    this.world.projectiles.release(projectile);
  }

  private hitEnemies(projectile: ProjectileEntity): void {
    const candidates = this.world.enemyGrid.queryCircle(
      projectile.x,
      projectile.y,
      projectile.radius + 40,
      this.world.enemyQuery,
    );

    for (let i = 0; i < candidates.length; i += 1) {
      const enemy = candidates[i];
      if (!enemy || !enemy.active || enemy.id === projectile.lastHitId) continue;
      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      const reach = enemy.radius + projectile.radius;
      if (dx * dx + dy * dy > reach * reach) continue;

      this.onProjectileHit(projectile, enemy);
      return;
    }
  }

  private onProjectileHit(projectile: ProjectileEntity, enemy: EnemyEntity): void {
    const result = this.combat.damageEnemy(enemy, projectile.damage, {
      critChance: projectile.critChance,
      critMult: projectile.critMult,
      sourceSkill: projectile.sourceSkill,
      color: projectile.color,
      ignoreArmor: projectile.kind === 'senbon' || projectile.kind === 'needle',
    });

    this.world.spawnVfx({
      kind: 'explosion',
      x: projectile.x,
      y: projectile.y,
      color: projectile.color,
      life: 0.18,
      radius: projectile.radius * 2.2,
      width: 2,
    });

    projectile.lastHitId = enemy.id;

    if (result.killed && projectile.ricochetLeft <= 0) {
      this.world.projectiles.release(projectile);
      return;
    }
    if (projectile.pierceLeft > 0) {
      projectile.pierceLeft -= 1;
      return;
    }
    if (projectile.ricochetLeft > 0) {
      projectile.ricochetLeft -= 1;
      const next = this.world.enemyGrid.nearest(projectile.x, projectile.y, 460, projectile.lastHitId);
      if (!next) {
        this.world.projectiles.release(projectile);
        return;
      }
      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const angle = Math.atan2(next.y - projectile.y, next.x - projectile.x);
      projectile.vx = Math.cos(angle) * speed;
      projectile.vy = Math.sin(angle) * speed;
      projectile.targetId = next.id;
      projectile.lifetime = Math.max(projectile.lifetime, 0.6);
      return;
    }
    this.world.projectiles.release(projectile);
  }

  private updateZones(dt: number): void {
    this.world.zones.forEachActive((zone) => {
      zone.duration -= dt;
      if (zone.duration <= 0) {
        this.world.zones.release(zone);
        return;
      }
      zone.tickTimer -= dt;
      if (zone.tickTimer > 0) return;
      zone.tickTimer = zone.tickInterval;
      this.applyZoneTick(zone);
    });
  }

  private applyZoneTick(zone: ZoneEntity): void {
    const enemies = this.world.enemyGrid.queryCircle(zone.x, zone.y, zone.radius, this.world.enemyQuery);
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      if (!enemy || !enemy.active) continue;
      const damage = zone.damage * zone.damageAmp;
      this.combat.damageEnemy(enemy, damage, {
        sourceSkill: zone.skillId,
        color: zone.color,
        showText: false,
      });
      if (enemy.active && zone.slowFactor < 1) {
        enemy.slowFactor = Math.min(enemy.slowFactor, zone.slowFactor);
        enemy.slowTimer = Math.max(enemy.slowTimer, 0.35);
      }
    }
  }

  private updateOrbitals(dt: number): void {
    const player = this.state.player;
    this.world.orbitals.forEachActive((orbital) => {
      orbital.angle += orbital.angularSpeed * dt;
      orbital.x = player.x + Math.cos(orbital.angle) * orbital.orbitRadius;
      orbital.y = player.y + Math.sin(orbital.angle) * orbital.orbitRadius;
      this.updateOrbitalHits(orbital, dt);
    });
  }

  private updateOrbitalHits(orbital: OrbitalEntity, dt: number): void {
    for (const [enemyId, cooldown] of orbital.hitCooldowns) {
      const next = cooldown - dt;
      if (next <= 0) orbital.hitCooldowns.delete(enemyId);
      else orbital.hitCooldowns.set(enemyId, next);
    }

    const enemies = this.world.enemyGrid.queryCircle(
      orbital.x,
      orbital.y,
      orbital.radius + 34,
      this.world.enemyQuery,
    );
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      if (!enemy || !enemy.active || orbital.hitCooldowns.has(enemy.id)) continue;
      const dx = enemy.x - orbital.x;
      const dy = enemy.y - orbital.y;
      const reach = enemy.radius + orbital.radius;
      if (dx * dx + dy * dy > reach * reach) continue;
      orbital.hitCooldowns.set(enemy.id, ORBITAL_HIT_COOLDOWN);
      const result = this.combat.damageEnemy(enemy, orbital.damage, {
        sourceSkill: orbital.skillId,
        color: orbital.color,
        knockback: orbital.knockback,
      });
      if (result.crit && orbital.launchOnCrit && enemy.active) {
        const angle = Math.atan2(enemy.y - orbital.y, enemy.x - orbital.x);
        this.world.spawnProjectile({
          kind: 'shuriken',
          x: orbital.x,
          y: orbital.y,
          vx: Math.cos(angle) * 620,
          vy: Math.sin(angle) * 620,
          damage: orbital.damage * 0.8,
          sourceSkill: orbital.skillId,
          pierce: 2,
          lifetime: 0.9,
          color: orbital.color,
          radius: orbital.radius * 0.9,
          knockback: 6,
        });
      }
    }
  }
}
