/**
 * Синхронизация пулов с Pixi-спрайтами: враги, снаряды, сферы, зоны, орбиталы, игрок.
 * Зависимости: pixi.js, World, GameState, TextureFactory, data/ultimate.
 */

import { Container, Sprite } from 'pixi.js';
import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { EnemyArchetypeId, ProjectileKind } from '@/types/game';
import { ULTIMATE_CONFIG } from '@/data/ultimate';
import type { ProceduralSprites } from '@/assets/ProceduralSprites';

const ENEMY_DRAW_RADIUS: Record<EnemyArchetypeId, number> = {
  genin: 24,
  assassin: 24,
  samurai: 26,
  archer: 20,
  miniBoss: 38,
};

export class EntityRenderer {
  readonly container = new Container();
  private readonly zoneLayer = new Container();
  private readonly pickupLayer = new Container();
  private readonly entityLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly orbitalLayer = new Container();
  private readonly playerContainer = new Container();
  private readonly playerBody = new Sprite();
  private readonly playerShadow = new Sprite();

  private readonly enemySprites: Sprite[] = [];
  private readonly enemyTextures: (EnemyArchetypeId | null)[] = [];
  private readonly enemyFlashing: boolean[] = [];
  private readonly projectileSprites: Sprite[] = [];
  private readonly projectileTextures: (ProjectileKind | null)[] = [];
  private readonly pickupSprites: Sprite[] = [];
  private readonly zoneSprites: Sprite[] = [];
  private readonly orbitalSprites: Sprite[] = [];

  constructor(
    private readonly world: World,
    private readonly textures: ProceduralSprites,
  ) {
    this.entityLayer.sortableChildren = true;
    this.container.addChild(
      this.zoneLayer,
      this.pickupLayer,
      this.entityLayer,
      this.projectileLayer,
      this.orbitalLayer,
      this.playerContainer,
    );

    this.playerShadow.texture = textures.playerShadow;
    this.playerShadow.anchor.set(0.5);
    this.playerBody.texture = textures.player;
    this.playerBody.anchor.set(0.5);
    this.playerContainer.addChild(this.playerShadow, this.playerBody);

    this.createEnemySprites();
    this.createProjectileSprites();
    this.createPickupSprites();
    this.createZoneSprites();
    this.createOrbitalSprites();
  }

  private createEnemySprites(): void {
    for (let i = 0; i < this.world.enemies.capacity; i += 1) {
      const sprite = new Sprite(this.textures.enemy.genin);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.enemySprites.push(sprite);
      this.enemyTextures.push(null);
      this.enemyFlashing.push(false);
      this.entityLayer.addChild(sprite);
    }
  }

  private createProjectileSprites(): void {
    for (let i = 0; i < this.world.projectiles.capacity; i += 1) {
      const sprite = new Sprite(this.textures.projectile.kunai);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.projectileSprites.push(sprite);
      this.projectileTextures.push(null);
      this.projectileLayer.addChild(sprite);
    }
  }

  private createPickupSprites(): void {
    for (let i = 0; i < this.world.pickups.capacity; i += 1) {
      const sprite = new Sprite(this.textures.xpOrb);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.pickupSprites.push(sprite);
      this.pickupLayer.addChild(sprite);
    }
  }

  private createZoneSprites(): void {
    for (let i = 0; i < this.world.zones.capacity; i += 1) {
      const sprite = new Sprite(this.textures.zoneKind.smoke);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.zoneSprites.push(sprite);
      this.zoneLayer.addChild(sprite);
    }
  }

  private createOrbitalSprites(): void {
    for (let i = 0; i < this.world.orbitals.capacity; i += 1) {
      const sprite = new Sprite(this.textures.projectile.shuriken);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.orbitalSprites.push(sprite);
      this.orbitalLayer.addChild(sprite);
    }
  }

  update(state: GameState, time: number): void {
    this.syncEnemies();
    this.syncProjectiles();
    this.syncPickups(time);
    this.syncZones();
    this.syncOrbitals();
    this.syncPlayer(state, time);
  }

  private syncEnemies(): void {
    const items = this.world.enemies.items;
    for (let i = 0; i < items.length; i += 1) {
      const enemy = items[i];
      const sprite = this.enemySprites[i];
      if (!enemy || !sprite) continue;
      sprite.visible = enemy.active;
      if (!enemy.active) continue;

      const flashing = enemy.hitFlashTimer > 0;
      if (this.enemyTextures[i] !== enemy.archetype || this.enemyFlashing[i] !== flashing) {
        this.enemyTextures[i] = enemy.archetype;
        this.enemyFlashing[i] = flashing;
        sprite.texture = flashing
          ? this.textures.enemyFlash[enemy.archetype]
          : this.textures.enemy[enemy.archetype];
      }
      sprite.position.set(enemy.x, enemy.y);
      sprite.zIndex = enemy.y;
      const eliteScale = enemy.isElite ? 1.18 : 1;
      sprite.scale.set((enemy.radius / ENEMY_DRAW_RADIUS[enemy.archetype]) * eliteScale);
      sprite.rotation = 0;
      sprite.tint = !flashing && enemy.isElite ? 0xffe0a8 : 0xffffff;
      sprite.alpha = enemy.freezeTimer > 0 ? 0.75 : 1;
    }
  }

  private syncProjectiles(): void {
    const items = this.world.projectiles.items;
    for (let i = 0; i < items.length; i += 1) {
      const projectile = items[i];
      const sprite = this.projectileSprites[i];
      if (!projectile || !sprite) continue;
      sprite.visible = projectile.active;
      if (!projectile.active) continue;

      if (this.projectileTextures[i] !== projectile.kind) {
        this.projectileTextures[i] = projectile.kind;
        sprite.texture = this.textures.projectile[projectile.kind];
      }
      sprite.position.set(projectile.x, projectile.y);
      sprite.scale.set((projectile.radius / 6) * projectile.scale);
      sprite.rotation = Math.atan2(projectile.vy, projectile.vx);
      sprite.tint = projectile.color;
      sprite.alpha = 1;
    }
  }

  private syncPickups(time: number): void {
    const items = this.world.pickups.items;
    for (let i = 0; i < items.length; i += 1) {
      const pickup = items[i];
      const sprite = this.pickupSprites[i];
      if (!pickup || !sprite) continue;
      sprite.visible = pickup.active;
      if (!pickup.active) continue;

      sprite.texture = pickup.kind === 'heal' ? this.textures.healOrb : this.textures.xpOrb;
      sprite.position.set(pickup.x, pickup.y);
      sprite.scale.set(pickup.kind === 'heal' ? 1 : 0.75 + Math.min(0.8, pickup.value * 0.04));
      sprite.alpha = 0.7 + Math.sin(time * 5 + pickup.id) * 0.25;
      sprite.tint = pickup.color;
    }
  }

  private syncZones(): void {
    const items = this.world.zones.items;
    for (let i = 0; i < items.length; i += 1) {
      const zone = items[i];
      const sprite = this.zoneSprites[i];
      if (!zone || !sprite) continue;
      sprite.visible = zone.active;
      if (!zone.active) continue;

      sprite.texture = this.textures.zoneKind[zone.kind];
      sprite.position.set(zone.x, zone.y);
      const pulse = zone.kind === 'smoke' ? 1 + Math.sin(zone.duration * 6) * 0.04 : 1;
      sprite.scale.set(Math.max(0.2, (zone.radius * 2 * pulse) / 128));
      sprite.tint = zone.color;
      sprite.alpha = zone.kind === 'smoke' ? 0.8 : 0.92;
      sprite.rotation =
        zone.kind === 'vortex' || zone.kind === 'iceStorm'
          ? zone.duration * 2.2
          : zone.kind === 'smoke'
            ? zone.duration * 0.4
            : 0;
    }
  }

  private syncOrbitals(): void {
    const items = this.world.orbitals.items;
    for (let i = 0; i < items.length; i += 1) {
      const orbital = items[i];
      const sprite = this.orbitalSprites[i];
      if (!orbital || !sprite) continue;
      sprite.visible = orbital.active;
      if (!orbital.active) continue;

      sprite.position.set(orbital.x, orbital.y);
      sprite.scale.set(Math.max(0.4, orbital.radius / 11));
      sprite.rotation = orbital.angle;
      sprite.tint = orbital.color;
    }
  }

  private syncPlayer(state: GameState, time: number): void {
    const player = state.player;
    const ult = state.ultimate;
    let air = 0;
    if (ult.active) {
      if (ult.phase === 'ASCEND') air = Math.min(1, ult.timer / ULTIMATE_CONFIG.ascendDuration);
      else if (ult.phase === 'BARRAGE') air = 1;
      else if (ult.phase === 'DESCEND') air = Math.max(0, 1 - ult.timer / ULTIMATE_CONFIG.descendDuration);
    }

    this.playerContainer.position.set(player.x, player.y);
    this.playerContainer.visible = player.alive;
    this.playerBody.position.set(0, -34 * air);
    this.playerBody.scale.set(1 + 0.3 * air);
    this.playerBody.rotation = Math.atan2(player.facingY, player.facingX);
    this.playerBody.alpha = air > 0 ? 0.72 : player.invulnTimer > 0 && Math.sin(time * 40) > 0 ? 0.4 : 1;
    this.playerShadow.alpha = 0.55 * (1 - 0.55 * air);
    this.playerShadow.scale.set(1 - 0.25 * air);
    this.playerShadow.position.set(0, 10);
  }
}
