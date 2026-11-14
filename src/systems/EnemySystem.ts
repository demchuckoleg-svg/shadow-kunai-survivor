/**
 * Wave spawner, enemy steering, contact damage and ranged attacks.
 * Spawn rate and HP grow exponentially with run time.
 * Dependencies: GameState, World, PlayerSystem, data/enemies.
 */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { Camera } from '@/core/Camera';
import type { EnemyDefinition, EnemyEntity } from '@/types/game';
import type { PlayerSystem } from './PlayerSystem';
import {
  BOSS_INTERVAL_SECONDS,
  ENEMY_DEFINITIONS,
  MAX_ENEMIES_ALIVE,
  MAX_SPAWNS_PER_FRAME,
  getDamageMultiplier,
  getEliteChance,
  getHpMultiplier,
  getSpawnRate,
  getSpeedMultiplier,
  getWaveForMinute,
  getXpMultiplier,
} from '@/data/enemies';

const DESPAWN_DISTANCE = 2800;
const BOSS_DESPAWN_DISTANCE = 4400;

export interface ViewportSize {
  width: number;
  height: number;
}

export class EnemySystem {
  private spawnAccumulator = 0;
  private elapsed = 0;
  private nextBossAt = BOSS_INTERVAL_SECONDS;

  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly playerSystem: PlayerSystem,
    private readonly camera: Camera,
    private readonly viewport: () => ViewportSize,
  ) {}

  reset(): void {
    this.spawnAccumulator = 0;
    this.elapsed = 0;
    this.nextBossAt = BOSS_INTERVAL_SECONDS;
  }

  update(dt: number): void {
    if (!this.state.isRunning) return;
    this.elapsed += dt;

    this.spawnHorde(dt);

    if (this.elapsed >= this.nextBossAt) {
      this.nextBossAt += BOSS_INTERVAL_SECONDS;
      this.spawnBoss();
    }

    this.world.enemies.forEachActive((enemy) => this.updateEnemy(enemy, dt));
    this.world.rebuildEnemyGrid();
  }

  private spawnHorde(dt: number): void {
    this.spawnAccumulator += getSpawnRate(this.elapsed) * dt;
    let spawned = 0;

    while (this.spawnAccumulator >= 1 && spawned < MAX_SPAWNS_PER_FRAME) {
      if (this.world.enemies.activeCount >= MAX_ENEMIES_ALIVE) {
        this.spawnAccumulator = 0;
        return;
      }
      this.spawnAccumulator -= 1;
      spawned += 1;

      const wave = getWaveForMinute(this.state.timer.minute);
      const archetype = wave.archetypes[Math.floor(Math.random() * wave.archetypes.length)];
      if (!archetype) continue;
      const elite = Math.random() < getEliteChance(this.elapsed);
      this.spawnAtEdge(ENEMY_DEFINITIONS[archetype], elite);
    }
  }

  private spawnBoss(): void {
    this.spawnAtEdge(ENEMY_DEFINITIONS.miniBoss, false, 1.6);
    this.world.spawnVfx({
      kind: 'shockwave',
      x: this.state.player.x,
      y: this.state.player.y,
      color: 0xe63946,
      life: 0.6,
      radius: 160,
      width: 5,
    });
    this.state.emit('bossSpawned', { at: this.elapsed });
  }

  private spawnAtEdge(def: EnemyDefinition, elite: boolean, bossHpBonus = 1): void {
    const { width, height } = this.viewport();
    const halfDiagonal = Math.hypot(width, height) / (2 * Math.max(0.5, this.camera.zoom));
    const distance = halfDiagonal + 90 + Math.random() * 120;
    const angle = Math.random() * Math.PI * 2;
    const x = this.state.player.x + Math.cos(angle) * distance;
    const y = this.state.player.y + Math.sin(angle) * distance;

    const hpMultiplier = getHpMultiplier(this.elapsed) * bossHpBonus;
    const speedMultiplier = getSpeedMultiplier(this.elapsed);
    const enemy = this.world.spawnEnemy(def, x, y, hpMultiplier, speedMultiplier, elite);
    if (!enemy) return;

    enemy.damage = Math.round(def.contactDamage * getDamageMultiplier(this.elapsed) * (elite ? 1.5 : 1));
    enemy.xpValue = Math.max(1, Math.round(def.xpValue * getXpMultiplier(this.elapsed)));
    if (def.archetype === 'miniBoss') enemy.attackTimer = 1.2;
  }

  private updateEnemy(enemy: EnemyEntity, dt: number): void {
    const player = this.state.player;
    if (!player.alive) return;

    this.tickStatuses(enemy, dt);

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const dirX = dist > 0.001 ? dx / dist : 0;
    const dirY = dist > 0.001 ? dy / dist : 0;
    const canMove = enemy.stunTimer <= 0 && enemy.freezeTimer <= 0;
    const slow = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    const speed = enemy.speed * slow;

    if (canMove) {
      const def = ENEMY_DEFINITIONS[enemy.archetype];
      if (def.ai === 'strafeShoot') this.updateArcher(enemy, dirX, dirY, dist, speed, dt);
      else if (def.ai === 'boss') this.updateBoss(enemy, dirX, dirY, speed, dt);
      else this.moveTowards(enemy, dirX, dirY, speed, dt);
    }

    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    if (dist <= enemy.radius + player.radius + 2 && enemy.attackTimer <= 0) {
      enemy.attackTimer = 0.9;
      this.playerSystem.damage(enemy.damage);
    }

    const despawn = enemy.archetype === 'miniBoss' ? BOSS_DESPAWN_DISTANCE : DESPAWN_DISTANCE;
    if (dist > despawn) this.world.enemies.release(enemy);
  }

  private moveTowards(enemy: EnemyEntity, dirX: number, dirY: number, speed: number, dt: number): void {
    enemy.vx = dirX * speed;
    enemy.vy = dirY * speed;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
  }

  private updateArcher(
    enemy: EnemyEntity,
    dirX: number,
    dirY: number,
    dist: number,
    speed: number,
    dt: number,
  ): void {
    const preferred = 280;
    const radial = dist > preferred + 30 ? 1 : dist < preferred - 30 ? -1 : 0;
    const strafeSign = enemy.id % 2 === 0 ? 1 : -1;
    enemy.vx = (dirX * radial - dirY * strafeSign * 0.6) * speed;
    enemy.vy = (dirY * radial + dirX * strafeSign * 0.6) * speed;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.attackTimer <= 0 && dist < 560) {
      enemy.attackTimer = ENEMY_DEFINITIONS.archer.attackCooldown;
      this.world.spawnProjectile({
        kind: 'enemyArrow',
        x: enemy.x,
        y: enemy.y,
        vx: dirX * ENEMY_DEFINITIONS.archer.projectileSpeed,
        vy: dirY * ENEMY_DEFINITIONS.archer.projectileSpeed,
        damage: Math.round(enemy.damage * 0.7),
        faction: 'enemy',
        color: 0x2ec4b6,
        radius: 5,
        lifetime: 3.5,
      });
    }
  }

  private updateBoss(enemy: EnemyEntity, dirX: number, dirY: number, speed: number, dt: number): void {
    this.moveTowards(enemy, dirX, dirY, speed, dt);
    if (enemy.attackTimer > 0) return;
    enemy.attackTimer = ENEMY_DEFINITIONS.miniBoss.attackCooldown;
    const count = 9;
    const baseAngle = Math.atan2(dirY, dirX);
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * 0.2;
      this.world.spawnProjectile({
        kind: 'enemyArrow',
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * ENEMY_DEFINITIONS.miniBoss.projectileSpeed,
        vy: Math.sin(angle) * ENEMY_DEFINITIONS.miniBoss.projectileSpeed,
        damage: Math.round(enemy.damage * 0.55),
        faction: 'enemy',
        color: 0xe63946,
        radius: 7,
        lifetime: 4.2,
      });
    }
  }

  private tickStatuses(enemy: EnemyEntity, dt: number): void {
    enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
    enemy.freezeTimer = Math.max(0, enemy.freezeTimer - dt);
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
  }
}
