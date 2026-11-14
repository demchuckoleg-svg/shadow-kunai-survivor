/**
 * Контроллер ниндзя: движение, сбор сфер, i-frames и получение урона.
 * Зависимости: GameState, World.
 */

import type { GameState } from '@/core/GameState';
import { MAX_CHARACTER_LEVEL } from '@/core/GameState';
import type { World } from '@/core/World';

const PICKUP_ACCEL = 900;
const PICKUP_MAX_SPEED = 720;
const HIT_IFRAMES = 0.6;
const ARENA_LIMIT = 3300;

export class PlayerSystem {
  constructor(
    private readonly state: GameState,
    private readonly world: World,
  ) {}

  update(dt: number): void {
    const player = this.state.player;
    if (!player.alive || !this.state.isRunning) return;

    this.move(dt);
    this.collectPickups(dt);
  }

  private move(dt: number): void {
    const player = this.state.player;
    if (this.state.ultimate.active) {
      player.vx = 0;
      player.vy = 0;
      return;
    }
    const input = this.state.input;
    const boost = player.speedBoostTimer > 0 ? 1.2 : 1;
    const speed = player.speed * boost;

    if (input.active) {
      player.vx = input.moveX * speed;
      player.vy = input.moveY * speed;
      const len = Math.hypot(player.vx, player.vy);
      if (len > 0.01) {
        player.facingX = player.vx / len;
        player.facingY = player.vy / len;
      }
    } else {
      player.vx = 0;
      player.vy = 0;
    }

    player.x = Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, player.x + player.vx * dt));
    player.y = Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, player.y + player.vy * dt));
  }

  private collectPickups(dt: number): void {
    const player = this.state.player;
    const radius = player.pickupRadius;

    this.world.pickups.forEachActive((pickup) => {
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= radius) pickup.magnetized = true;
      if (!pickup.magnetized) {
        pickup.lifetime -= dt;
        if (pickup.lifetime <= 0) this.world.pickups.release(pickup);
        return;
      }

      const speed = Math.min(PICKUP_MAX_SPEED, PICKUP_ACCEL * dt + 220);
      const inv = dist > 0.001 ? 1 / dist : 0;
      pickup.x += dx * inv * speed * dt;
      pickup.y += dy * inv * speed * dt;

      if (dist <= player.radius + pickup.radius + 6) {
        if (pickup.kind === 'xp') {
          this.gainXp(pickup.value);
        } else {
          player.hp = Math.min(player.maxHp, player.hp + pickup.value);
          this.state.emit('playerDamaged', { healed: pickup.value });
        }
        this.world.spawnVfx({
          kind: 'ring',
          x: pickup.x,
          y: pickup.y,
          color: pickup.color,
          life: 0.25,
          radius: 16,
          width: 2,
        });
        this.world.pickups.release(pickup);
      }
    });
  }

  gainXp(value: number): void {
    const player = this.state.player;
    this.state.addXp(value);
    while (player.xp >= player.nextLevelXp && player.level < MAX_CHARACTER_LEVEL) {
      player.xp -= player.nextLevelXp;
      player.level += 1;
      player.nextLevelXp = Math.floor(player.nextLevelXp * 1.18 + 2);
      this.state.stats.level = player.level;
      this.state.emit('levelUp', { level: player.level });
      if (player.level >= MAX_CHARACTER_LEVEL && !player.ultUnlocked) {
        player.ultUnlocked = true;
        player.ultCharge = 0;
        this.state.emit('ultimateUnlocked');
      }
    }
    if (player.level >= MAX_CHARACTER_LEVEL) player.xp = Math.min(player.xp, player.nextLevelXp);
  }

  damage(amount: number): void {
    const player = this.state.player;
    if (!player.alive || player.invulnTimer > 0 || this.state.ultimate.active) return;
    const taken = Math.max(1, Math.round(amount - player.armor));
    player.hp = Math.max(0, player.hp - taken);
    player.invulnTimer = HIT_IFRAMES;
    this.state.emit('playerDamaged', { amount: taken, hp: player.hp });

    if (player.hp <= 0) {
      this.state.finishRun();
      this.world.spawnVfx({
        kind: 'explosion',
        x: player.x,
        y: player.y,
        color: 0xff2e4d,
        life: 0.5,
        radius: 90,
        width: 6,
      });
    }
  }
}
