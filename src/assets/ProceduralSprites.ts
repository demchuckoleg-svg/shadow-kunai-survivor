/**
 * Facade over procedural texture sets. Every texture is generated on an
 * offscreen canvas at 2x resolution; no PNG assets are shipped.
 */

import type { Texture } from 'pixi.js';
import type { EnemyArchetypeId, ProjectileKind } from '@/types/game';
import { createEnemyTextures } from './enemySprites';
import { createProjectileTextures } from './projectileSprites';
import { createEffectTextures } from './effectSprites';

export class ProceduralSprites {
  readonly enemy: Record<EnemyArchetypeId, Texture>;
  readonly enemyFlash: Record<EnemyArchetypeId, Texture>;
  readonly projectile: Record<ProjectileKind, Texture>;
  readonly player: Texture;
  readonly playerShadow: Texture;
  readonly xpOrb: Texture;
  readonly healOrb: Texture;
  readonly glow: Texture;
  readonly ring: Texture;
  readonly line: Texture;
  readonly spark: Texture;
  readonly zone: Texture;
  readonly mote: Texture;

  constructor() {
    const enemies = createEnemyTextures();
    this.enemy = enemies.normal;
    this.enemyFlash = enemies.flash;
    this.projectile = createProjectileTextures();

    const effects = createEffectTextures();
    this.player = effects.player;
    this.playerShadow = effects.playerShadow;
    this.xpOrb = effects.xpOrb;
    this.healOrb = effects.healOrb;
    this.glow = effects.glow;
    this.ring = effects.ring;
    this.line = effects.line;
    this.spark = effects.spark;
    this.zone = effects.zone;
    this.mote = effects.mote;
  }
}
