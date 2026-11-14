/**
 * Спавнер волн, ИИ врагов, контактный урон и стрельба лучников.
 * Зависимости: GameState, World, PlayerSystem, data/enemies.
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
  getWaveForMinute,
} from '@/data/enemies';

const DESPAWN_DISTANCE = 2600;
const BOSS_DESPAWN_DISTANCE = 4200;

export interface ViewportSize {
  width: number;
  height: number;
}

export class EnemySystem {
  private spawnTimer = 0;
  private bossTimer = 0;
  private nextBossAt = BOSS_INTERVAL_SECONDS;
  private elapsed = 0;

  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly playerSystem: PlayerSystem,
    private readonly camera: Camera,
    private readonly viewport: () => ViewportSize,
  ) {}

  reset(): void {
    this.spawnTimer = 0;
    this.bossTimer = 0;
    this.elapsed = 0;
    this.nextBossAt = BOSS_INTERVAL_SECONDS;
  }

  update(dt: number): void {
    if (!this.state.isRunning) return;
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.bossTimer += dt;

    this.spawnWave();

    if (this.elapsed >= this.nextBossAt) {
      this.nextBossAt += BOSS_INTERVAL_SECONDS;
      this.spawnBoss();
    }

    this.world.enemies.forEachActive((enemy) => this.updateEnemy(enemy, dt));
    this.world.rebuildEnemyGrid();
  }

  private spawnWave(): void {
    const wave = getWaveForMinute(this.state.timer.minute);
    const interval = 1 / Math.max(0.05, wave.spawnRate);
    if (this.spawnTimer < interval) return;
    this.spawnTimer = 0;

    if (this.world.enemies.activeCount >= MAX_ENEMIES_ALIVE) return;
    const archetype = wave.archetypes[Math.floor(Math.random() * wave.archetypes.length)];
    if (!archetype) return;
    const def = ENEMY_DEFINITIONS[archetype];
    const elite = this.elapsed > 300 && Math.random() < 0.04;
    this.spawnAtEdge(def, wave.hpMultiplier, wave.speedMultiplier, elite);
  }

  private spawnBoss(): void {
    const wave = getWaveForMinute(this.state.timer.minute);
    this.spawnAtEdge(ENEMY_DEFINITIONS.miniBoss, wave.hpMultiplier * 1.4, 1, false);
    this.world.spawnVfx({
      kind: 'shockwave',
      x: this.state.player.x,
      y: this.state.player.y,
      color: 0xff7a1a,
      life: 0.6,
      radius: 140,
      width: 4,
    });
    this.state.emit('bossSpawned', { at: this.elapsed });
  }

  private spawnAtEdge(
    def: EnemyDefinition,
    hpMultiplier: number,
    speedMultiplier: number,
    elite: boolean,
  ): void {
    const { width, height } = this.viewport();
    const halfDiagonal = Math.hypot(width, height) / (2 * Math.max(0.5, this.camera.zoom));
    const distance = halfDiagonal + 80;
    const angle = Math.random() * Math.PI * 2;
    const x = this.state.player.x + Math.cos(angle) * distance;
    const y = this.state.player.y + Math.sin(angle) * distance;
    const enemy = this.world.spawnEnemy(def, x, y, hpMultiplier, speedMultiplier, elite);
    if (enemy && def.archetype === 'miniBoss') {
      enemy.attackTimer = 1.2;
    }
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
    const preferred = 260;
    const radial = dist > preferred + 30 ? 1 : dist < preferred - 30 ? -1 : 0;
    const strafeSign = enemy.id % 2 === 0 ? 1 : -1;
    enemy.vx = (dirX * radial + -dirY * strafeSign * 0.6) * speed;
    enemy.vy = (dirY * radial + dirX * strafeSign * 0.6) * speed;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.attackTimer <= 0 && dist < 520) {
      const def = ENEMY_DEFINITIONS.archer;
      enemy.attackTimer = def.attackCooldown;
      this.world.spawnProjectile({
        kind: 'enemyArrow',
        x: enemy.x,
        y: enemy.y,
        vx: dirX * def.projectileSpeed,
        vy: dirY * def.projectileSpeed,
        damage: 7,
        faction: 'enemy',
        color: 0x35e6ff,
        radius: 5,
        lifetime: 3.5,
      });
    }
  }

  private updateBoss(enemy: EnemyEntity, dirX: number, dirY: number, speed: number, dt: number): void {
    this.moveTowards(enemy, dirX, dirY, speed, dt);
    if (enemy.attackTimer > 0) return;
    enemy.attackTimer = ENEMY_DEFINITIONS.miniBoss.attackCooldown;
    const count = 7;
    const baseAngle = Math.atan2(dirY, dirX);
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * 0.22;
      this.world.spawnProjectile({
        kind: 'enemyArrow',
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * ENEMY_DEFINITIONS.miniBoss.projectileSpeed,
        vy: Math.sin(angle) * ENEMY_DEFINITIONS.miniBoss.projectileSpeed,
        damage: 10,
        faction: 'enemy',
        color: 0xff7a1a,
        radius: 7,
        lifetime: 4,
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
