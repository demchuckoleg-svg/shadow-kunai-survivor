/** Player, pickup, VFX and arena textures drawn with the ink pipeline. */

import type { Texture } from 'pixi.js';
import { PALETTE as P } from './palette';
import { inkShape, orb, polygon, splatter, star, texture } from './inkCanvas';

export interface EffectTextureSet {
  player: Texture;
  playerShadow: Texture;
  xpOrb: Texture;
  healOrb: Texture;
  glow: Texture;
  ring: Texture;
  line: Texture;
  spark: Texture;
  smokePuff: Texture;
  mote: Texture;
}

function drawPlayer(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(36, 36);
  inkShape(ctx, polygon(15, 8, -Math.PI / 2), P.slate, P.ink, P.crimson, 83);

  // Shoulder plates.
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 3;
  ctx.fillStyle = P.ash;
  ctx.beginPath();
  ctx.arc(0, 0, 12, -1.9, -0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0.7, 1.9);
  ctx.stroke();

  // Hood and mask.
  ctx.fillStyle = P.ink;
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = P.crimson;
  ctx.fillRect(-4, -4, 10, 4);
  ctx.fillStyle = P.outline;
  ctx.fillRect(-4, -4, 10, 1.5);
  ctx.fillStyle = P.jade;
  ctx.beginPath();
  ctx.ellipse(4, -4, 2, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crimson scarf knot.
  ctx.fillStyle = P.crimson;
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-6, 3, 4, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Katana across the back.
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, 11);
  ctx.lineTo(17, -12);
  ctx.stroke();
  ctx.strokeStyle = P.bone;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, 11);
  ctx.lineTo(17, -12);
  ctx.stroke();
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-3, 5);
  ctx.lineTo(2, 9);
  ctx.stroke();

  // Jade rim.
  ctx.strokeStyle = P.jade;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  splatter(ctx, [[20, 20], [52, 20], [20, 52], [52, 52]], P.crimson, 89);
  splatter(ctx, [[26, 50], [46, 14]], P.jade, 97);
}

export function createEffectTextures(): EffectTextureSet {
  return {
    player: texture(72, drawPlayer),
    playerShadow: texture(64, (ctx) => {
      ctx.fillStyle = 'rgba(5,5,7,0.55)';
      ctx.filter = 'blur(2px)';
      ctx.beginPath();
      ctx.ellipse(32, 32, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
    }),
    xpOrb: orb(40, P.jade, 'rgba(46,196,182,0.75)'),
    healOrb: orb(40, P.crimson, 'rgba(230,57,70,0.7)'),
    glow: texture(64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
      g.addColorStop(0, 'rgba(241,250,238,0.95)');
      g.addColorStop(0.35, 'rgba(241,250,238,0.35)');
      g.addColorStop(1, 'rgba(241,250,238,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }),
    ring: texture(48, (ctx) => {
      ctx.strokeStyle = P.bone;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 24, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(5,5,7,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(24, 24, 21.5, 0, Math.PI * 2);
      ctx.stroke();
    }),
    line: texture(48, (ctx) => {
      const g = ctx.createLinearGradient(4, 0, 44, 0);
      g.addColorStop(0, 'rgba(241,250,238,0.15)');
      g.addColorStop(0.5, P.bone);
      g.addColorStop(1, 'rgba(241,250,238,0.15)');
      ctx.fillStyle = g;
      ctx.fillRect(4, 22, 40, 4);
      ctx.fillStyle = P.crimson;
      ctx.fillRect(6, 23, 8, 2);
    }),
    spark: texture(24, (ctx) => {
      const points = star(9, 3, 4).map(([x, y]) => [x + 12, y + 12] as const);
      ctx.fillStyle = P.bone;
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = P.outline;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      splatter(ctx, points, P.crimson, 41);
    }),
    smokePuff: texture(64, (ctx) => {
      const puffs = [
        [22, 30, 17],
        [40, 28, 16],
        [32, 40, 18],
      ] as const;
      for (const [x, y, r] of puffs) {
        const g = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, r);
        g.addColorStop(0, 'rgba(46,196,182,0.55)');
        g.addColorStop(0.55, 'rgba(141,153,174,0.35)');
        g.addColorStop(1, 'rgba(11,12,16,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(5,5,7,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(32, 32, 20, 0.4, Math.PI * 1.6);
      ctx.stroke();
      ctx.fillStyle = P.jade;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(44, 20, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }),
    mote: texture(16, (ctx) => {
      const g = ctx.createRadialGradient(8, 8, 0.5, 8, 8, 7);
      g.addColorStop(0, 'rgba(241,250,238,0.9)');
      g.addColorStop(1, 'rgba(241,250,238,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 16, 16);
    }),
  };
}
