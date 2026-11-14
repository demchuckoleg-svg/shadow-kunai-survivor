/** Enemy archetype textures with ink silhouette and white hit-flash variants. */

import type { Texture } from 'pixi.js';
import type { EnemyArchetypeId } from '@/types/game';
import { PALETTE as P } from './palette';
import { inkShape, polygon, star, texture, type Point } from './inkCanvas';

export interface EnemyTextureSet {
  normal: Record<EnemyArchetypeId, Texture>;
  flash: Record<EnemyArchetypeId, Texture>;
}

function enemyTexture(
  points: readonly Point[],
  top: string,
  bottom: string,
  accent: string,
  seed: number,
  size = 64,
): Texture {
  return texture(size, (ctx) => {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    inkShape(ctx, points, top, bottom, accent, seed);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(3, 3);
    ctx.stroke();
    ctx.restore();
  });
}

function flashTexture(points: readonly Point[], size: number): Texture {
  return texture(size, (ctx) => {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = P.bone;
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

export function createEnemyTextures(): EnemyTextureSet {
  const shapes: Record<EnemyArchetypeId, { points: Point[]; top: string; bottom: string; accent: string; seed: number; size: number }> = {
    genin: { points: polygon(15, 4), top: P.ash, bottom: P.slate, accent: P.jade, seed: 11, size: 64 },
    assassin: { points: polygon(14, 3), top: P.crimson, bottom: '#7d1620', accent: P.goldLight, seed: 17, size: 64 },
    samurai: { points: polygon(18, 6), top: P.gold, bottom: '#6b5313', accent: P.bone, seed: 23, size: 64 },
    archer: { points: polygon(13, 8), top: P.jade, bottom: '#155f58', accent: P.goldLight, seed: 29, size: 64 },
    miniBoss: { points: star(34, 21, 9), top: P.crimson, bottom: '#5c0f18', accent: P.gold, seed: 37, size: 96 },
  };

  const normal = {} as Record<EnemyArchetypeId, Texture>;
  const flash = {} as Record<EnemyArchetypeId, Texture>;
  for (const id of Object.keys(shapes) as EnemyArchetypeId[]) {
    const shape = shapes[id];
    normal[id] = enemyTexture(shape.points, shape.top, shape.bottom, shape.accent, shape.seed, shape.size);
    flash[id] = flashTexture(shape.points, shape.size);
  }
  return { normal, flash };
}
