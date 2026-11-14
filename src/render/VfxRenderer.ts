/**
 * VFX-слой: шлейфы, взрывы, кольца, линии разрезов ульты.
 * Зависимости: pixi.js, World, TextureFactory.
 */

import { Container, Sprite, type Texture } from 'pixi.js';
import type { World } from '@/core/World';
import type { VfxKind } from '@/types/game';
import type { ProceduralSprites } from '@/assets/ProceduralSprites';

export class VfxRenderer {
  readonly container = new Container();
  private readonly sprites: Sprite[] = [];

  constructor(
    private readonly world: World,
    private readonly textures: ProceduralSprites,
  ) {
    this.container.blendMode = 'add';
    for (let i = 0; i < world.vfx.capacity; i += 1) {
      const sprite = new Sprite(textures.glow);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      sprite.blendMode = 'add';
      this.sprites.push(sprite);
      this.container.addChild(sprite);
    }
  }

  private textureFor(kind: VfxKind): Texture {
    switch (kind) {
      case 'ring':
      case 'shockwave':
        return this.textures.ring;
      case 'slash':
        return this.textures.line;
      case 'trail':
        return this.textures.glow;
      case 'mark':
        return this.textures.ring;
      case 'hitFlash':
        return this.textures.spark;
      case 'explosion':
      default:
        return this.textures.glow;
    }
  }

  update(dt: number): void {
    const items = this.world.vfx.items;
    for (let i = 0; i < items.length; i += 1) {
      const vfx = items[i];
      const sprite = this.sprites[i];
      if (!vfx || !sprite) continue;
      if (!vfx.active) {
        sprite.visible = false;
        continue;
      }

      vfx.life -= dt;
      if (vfx.life <= 0) {
        sprite.visible = false;
        this.world.vfx.release(vfx);
        continue;
      }

      sprite.texture = this.textureFor(vfx.kind);
      const progress = vfx.maxLife > 0 ? 1 - vfx.life / vfx.maxLife : 1;
      const fade = Math.max(0, 1 - progress);

      if (vfx.kind === 'slash') {
        const dx = vfx.toX - vfx.fromX;
        const dy = vfx.toY - vfx.fromY;
        const length = Math.hypot(dx, dy) || 1;
        sprite.position.set((vfx.fromX + vfx.toX) / 2, (vfx.fromY + vfx.toY) / 2);
        sprite.rotation = Math.atan2(dy, dx);
        sprite.scale.set(length / 40, Math.max(0.4, vfx.width / 3));
        sprite.alpha = fade;
      } else if (vfx.kind === 'ring' || vfx.kind === 'shockwave') {
        const grow = 1 + progress * (vfx.kind === 'shockwave' ? 3.2 : 1.4);
        sprite.position.set(vfx.x, vfx.y);
        sprite.rotation = 0;
        sprite.scale.set((vfx.radius / 20) * grow);
        sprite.alpha = fade * 0.9;
      } else {
        const grow = vfx.kind === 'explosion' ? 1 + progress * 1.2 : 1 - progress * 0.5;
        sprite.position.set(vfx.x, vfx.y);
        sprite.rotation = vfx.rotation;
        sprite.scale.set((vfx.radius / 20) * Math.max(0.15, grow));
        sprite.alpha = fade;
      }
      sprite.tint = vfx.color;
    }
  }
}
