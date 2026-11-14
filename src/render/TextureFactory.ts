/**
 * Процедурная генерация всех текстур через Pixi Graphics -> generateTexture.
 * Никаких внешних PNG: чёткость на любом DPI и нулевая загрузка ассетов.
 * Зависимости: pixi.js, @/types/game.
 */

import { Graphics, type Renderer, type Texture } from 'pixi.js';
import type { EnemyArchetypeId, ProjectileKind } from '@/types/game';

const RESOLUTION = 2;

function makeTexture(renderer: Renderer, graphics: Graphics): Texture {
  const texture = renderer.generateTexture({ target: graphics, resolution: RESOLUTION });
  graphics.destroy();
  return texture;
}

function circle(renderer: Renderer, radius: number, color: number, stroke = 0, width = 0): Texture {
  const g = new Graphics();
  g.circle(0, 0, radius).fill({ color, alpha: 0.9 });
  if (width > 0) g.circle(0, 0, radius).stroke({ width, color: stroke, alpha: 0.9 });
  return makeTexture(renderer, g);
}

function glow(renderer: Renderer, radius: number, color: number): Texture {
  const g = new Graphics();
  g.circle(0, 0, radius).fill({ color, alpha: 0.22 });
  g.circle(0, 0, radius * 0.72).fill({ color, alpha: 0.32 });
  g.circle(0, 0, radius * 0.42).fill({ color, alpha: 0.9 });
  return makeTexture(renderer, g);
}

function ngon(
  renderer: Renderer,
  sides: number,
  radius: number,
  fill: number,
  stroke: number,
  rotation = -Math.PI / 2,
): Texture {
  const g = new Graphics();
  const points: number[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = rotation + (i / sides) * Math.PI * 2;
    points.push(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  g.poly(points).fill({ color: fill, alpha: 0.92 });
  g.poly(points).stroke({ width: 2, color: stroke, alpha: 0.95 });
  return makeTexture(renderer, g);
}

function star(renderer: Renderer, spikes: number, outer: number, inner: number, fill: number, stroke: number): Texture {
  const g = new Graphics();
  const points: number[] = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    points.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.poly(points).fill({ color: fill, alpha: 0.92 });
  g.poly(points).stroke({ width: 2, color: stroke, alpha: 0.95 });
  return makeTexture(renderer, g);
}

function kunai(renderer: Renderer, color: number): Texture {
  const g = new Graphics();
  g.moveTo(10, 0).lineTo(-6, -4).lineTo(-2, 0).lineTo(-6, 4).closePath().fill({ color, alpha: 0.95 });
  g.moveTo(-6, 0).lineTo(-11, 0).stroke({ width: 2, color, alpha: 0.6 });
  return makeTexture(renderer, g);
}

function shuriken(renderer: Renderer, color: number): Texture {
  const g = new Graphics();
  const points: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? 11 : 4;
    points.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.poly(points).fill({ color, alpha: 0.95 });
  g.circle(0, 0, 2.5).fill({ color: 0xffffff, alpha: 0.9 });
  return makeTexture(renderer, g);
}

function needle(renderer: Renderer, color: number): Texture {
  const g = new Graphics();
  g.roundRect(-9, -1.5, 18, 3, 1.5).fill({ color, alpha: 0.95 });
  return makeTexture(renderer, g);
}

function crescent(renderer: Renderer, color: number): Texture {
  const g = new Graphics();
  g.arc(0, 0, 14, -1.1, 1.1).stroke({ width: 5, color, alpha: 0.95 });
  return makeTexture(renderer, g);
}

function fireball(renderer: Renderer, color: number): Texture {
  const g = new Graphics();
  g.circle(0, 0, 11).fill({ color, alpha: 0.28 });
  g.circle(0, 0, 8).fill({ color, alpha: 0.6 });
  g.circle(0, 0, 5).fill({ color: 0xfff2c4, alpha: 0.95 });
  return makeTexture(renderer, g);
}

export class TextureFactory {
  readonly enemy: Record<EnemyArchetypeId, Texture>;
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

  constructor(renderer: Renderer) {
    this.enemy = {
      genin: ngon(renderer, 4, 15, 0x2a1b4d, 0x8b5cf6),
      assassin: ngon(renderer, 3, 14, 0x4d0f1a, 0xff2e4d),
      samurai: ngon(renderer, 6, 18, 0x3d2c10, 0xffc94a),
      archer: circle(renderer, 13, 0x0f3038, 0x35e6ff, 2),
      miniBoss: star(renderer, 8, 34, 22, 0x4d1f08, 0xff7a1a),
    };

    this.projectile = {
      kunai: kunai(renderer, 0xe8f7ff),
      shuriken: shuriken(renderer, 0xbfefff),
      katanaWave: crescent(renderer, 0xff2e4d),
      senbon: needle(renderer, 0xff8fa3),
      fireball: fireball(renderer, 0xff7a1a),
      iceShard: ngon(renderer, 4, 9, 0xbef7ff, 0x7fe7ff),
      needle: needle(renderer, 0xffb3c1),
      soulFire: glow(renderer, 10, 0x9be15d),
      phantomKunai: kunai(renderer, 0xff4d6d),
      cloneShot: kunai(renderer, 0x9b8cff),
      enemyArrow: needle(renderer, 0x35e6ff),
    };

    const playerGraphics = new Graphics();
    playerGraphics.circle(0, 0, 15).fill({ color: 0x121222, alpha: 1 });
    playerGraphics.circle(0, 0, 15).stroke({ width: 2.5, color: 0x35e6ff, alpha: 0.95 });
    playerGraphics.circle(0, 0, 5).fill({ color: 0x35e6ff, alpha: 0.18 });
    playerGraphics.circle(3, -3, 3.2).fill({ color: 0xff2e4d, alpha: 1 });
    playerGraphics.moveTo(12, 0).lineTo(26, 0).stroke({ width: 2, color: 0xd7f6ff, alpha: 0.85 });
    this.player = makeTexture(renderer, playerGraphics);

    const shadowGraphics = new Graphics();
    shadowGraphics.ellipse(0, 0, 16, 7).fill({ color: 0x000000, alpha: 0.55 });
    this.playerShadow = makeTexture(renderer, shadowGraphics);

    this.xpOrb = glow(renderer, 9, 0x35e6ff);
    this.healOrb = glow(renderer, 10, 0xff6b8a);
    this.glow = glow(renderer, 20, 0xffffff);
    this.ring = (() => {
      const g = new Graphics();
      g.circle(0, 0, 20).stroke({ width: 3, color: 0xffffff, alpha: 0.95 });
      return makeTexture(renderer, g);
    })();
    this.line = (() => {
      const g = new Graphics();
      g.roundRect(-20, -2, 40, 4, 2).fill({ color: 0xffffff, alpha: 1 });
      return makeTexture(renderer, g);
    })();
    this.spark = ngon(renderer, 4, 6, 0xffffff, 0xffffff);
    this.zone = (() => {
      const g = new Graphics();
      g.circle(0, 0, 40).fill({ color: 0xffffff, alpha: 0.16 });
      g.circle(0, 0, 40).stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
      return makeTexture(renderer, g);
    })();
  }
}
