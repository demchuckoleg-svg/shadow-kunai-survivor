/**
 * Enemy ink sprites: hooded genin and crimson assassin, plus imports of the
 * heavier samurai/archer/oni silhouettes.
 */

import type { Texture } from 'pixi.js';
import type { EnemyArchetypeId } from '@/types/game';
import { PALETTE as P } from './palette';
import { texture } from './inkCanvas';
import type { EnemyDraw } from './enemyDraw';
import { body, eye, spots, stroke } from './enemyDraw';
import { archerDraw, bossDraw, samuraiDraw } from './enemySpritesB';

export interface EnemyTextureSet {
  normal: Record<EnemyArchetypeId, Texture>;
  flash: Record<EnemyArchetypeId, Texture>;
}

const genin: EnemyDraw = (ctx, flash) => {
  const cloak = [
    [24, 74],
    [26, 56],
    [34, 44],
    [48, 40],
    [62, 44],
    [70, 56],
    [72, 74],
  ] as const;
  body(ctx, cloak, P.ash, P.slate, P.jade, 501, flash);

  ctx.fillStyle = flash ? P.bone : P.slate;
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, 31, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    ctx.fillStyle = P.outline;
    ctx.fillRect(38, 29, 20, 7);
    eye(ctx, 43, 32, 2.4, 1.3, P.crimson);
    eye(ctx, 53, 32, 2.4, 1.3, P.crimson);
    stroke(ctx, [[48, 40], [60, 48], [66, 58]], P.crimson, 4);
    stroke(ctx, [[64, 52], [78, 62]], P.bone, 2.5);
    spots(ctx, [[28, 70], [68, 70], [48, 42]], P.jade, 503);
  }

  stroke(ctx, [[40, 74], [36, 86]], flash ? P.bone : P.ash, 5);
  stroke(ctx, [[56, 74], [60, 86]], flash ? P.bone : P.ash, 5);
};

const assassin: EnemyDraw = (ctx, flash) => {
  const torso = [
    [32, 74],
    [30, 54],
    [40, 42],
    [56, 40],
    [66, 52],
    [64, 74],
  ] as const;
  body(ctx, torso, P.crimson, '#7d1620', P.goldLight, 509, flash);

  ctx.fillStyle = flash ? P.bone : '#5c0f18';
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, 32, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    eye(ctx, 44, 32, 2, 1.2, P.goldLight);
    eye(ctx, 52, 32, 2, 1.2, P.goldLight);
    stroke(ctx, [[46, 42], [30, 54], [18, 56]], P.crimson, 5);
    stroke(ctx, [[60, 48], [76, 40]], P.bone, 2.5);
    stroke(ctx, [[60, 56], [78, 64]], P.bone, 2.5);
    spots(ctx, [[32, 68], [62, 68], [48, 34]], P.crimson, 511);
  }

  stroke(ctx, [[38, 74], [28, 88]], flash ? P.bone : P.ash, 6);
  stroke(ctx, [[56, 74], [66, 88]], flash ? P.bone : P.ash, 6);
};

const DRAWS: Record<EnemyArchetypeId, EnemyDraw> = {
  genin,
  assassin,
  samurai: samuraiDraw,
  archer: archerDraw,
  miniBoss: bossDraw,
};

const SIZES: Record<EnemyArchetypeId, number> = {
  genin: 96,
  assassin: 96,
  samurai: 104,
  archer: 96,
  miniBoss: 144,
};

export function createEnemyTextures(): EnemyTextureSet {
  const normal = {} as Record<EnemyArchetypeId, Texture>;
  const flash = {} as Record<EnemyArchetypeId, Texture>;

  for (const id of Object.keys(DRAWS) as EnemyArchetypeId[]) {
    const size = SIZES[id];
    normal[id] = texture(size, (ctx) => {
      ctx.save();
      ctx.translate(size / 2, size / 2 - 2);
      DRAWS[id](ctx, false);
      ctx.restore();
    });
    flash[id] = texture(size, (ctx) => {
      ctx.save();
      ctx.translate(size / 2, size / 2 - 2);
      DRAWS[id](ctx, true);
      ctx.restore();
    });
  }
  return { normal, flash };
}
