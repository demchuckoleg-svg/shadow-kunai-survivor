/** Background decor textures: torii gate, stone lantern, shoji screen, bamboo, ink stains. */

import type { Texture } from 'pixi.js';
import { PALETTE as P } from './palette';
import { seeded, splatter, texture, type Ctx, type Point } from './inkCanvas';

export interface ArenaSpriteSet {
  torii: Texture;
  lantern: Texture;
  shoji: Texture;
  bamboo: Texture;
  stain: Texture;
}

function panel(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  top: string,
  bottom: string,
  outline = 3,
): void {
  ctx.save();
  ctx.translate(0, 3);
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = 'rgba(5,5,7,0.45)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = outline;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(241,250,238,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 2);
  ctx.lineTo(x + w - 1, y + 2);
  ctx.stroke();
}

function torii(ctx: Ctx, size: number): void {
  const cx = size / 2;
  const topBeam: Point[] = [
    [cx - 160, 62],
    [cx - 140, 84],
    [cx + 140, 84],
    [cx + 160, 62],
    [cx + 150, 96],
    [cx - 150, 96],
  ];
  ctx.fillStyle = P.crimson;
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  topBeam.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  panel(ctx, cx - 128, 118, 256, 22, P.crimson, '#7d1620', 3);
  panel(ctx, cx - 112, 92, 22, 270, '#c5303d', '#5c0f18', 4);
  panel(ctx, cx + 90, 92, 22, 270, '#c5303d', '#5c0f18', 4);
  panel(ctx, cx - 140, 352, 44, 14, '#3a3d47', P.ink, 3);
  panel(ctx, cx + 96, 352, 44, 14, '#3a3d47', P.ink, 3);

  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 100, 108);
  ctx.lineTo(cx + 100, 108);
  ctx.stroke();

  splatter(ctx, [[cx - 120, 80], [cx + 120, 80], [cx - 100, 340], [cx + 100, 340]], P.crimson, 307);
}

function lantern(ctx: Ctx, size: number): void {
  const cx = size / 2;
  panel(ctx, cx - 34, size - 28, 68, 18, '#3a3d47', P.ink, 3);
  panel(ctx, cx - 12, 118, 24, size - 140, '#565b69', '#232630', 3);
  panel(ctx, cx - 40, 72, 80, 52, '#6d7382', '#2c303a', 3);
  panel(ctx, cx - 46, 56, 92, 18, '#4a4f5c', '#1c1f27', 3);

  const g = ctx.createRadialGradient(cx, 98, 2, cx, 98, 26);
  g.addColorStop(0, 'rgba(243,229,171,0.95)');
  g.addColorStop(0.5, 'rgba(212,175,55,0.55)');
  g.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, 98, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 28, 80, 56, 36);
  ctx.beginPath();
  ctx.moveTo(cx, 80);
  ctx.lineTo(cx, 116);
  ctx.stroke();

  splatter(ctx, [[cx - 30, 60], [cx + 30, 60], [cx, size - 20]], P.ash, 311);
}

function shoji(ctx: Ctx, size: number): void {
  const w = size * 0.62;
  const h = size * 0.9;
  const x = (size - w) / 2;
  const y = size - h;
  panel(ctx, x, y, w, h, 'rgba(241,250,238,0.16)', 'rgba(141,153,174,0.06)', 4);

  ctx.strokeStyle = 'rgba(5,5,7,0.85)';
  ctx.lineWidth = 3;
  const cols = 4;
  const rows = 5;
  for (let i = 1; i < cols; i += 1) {
    const gx = x + (w / cols) * i;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i += 1) {
    const gy = y + (h / rows) * i;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  const glow = ctx.createLinearGradient(0, y, 0, y + h);
  glow.addColorStop(0, 'rgba(243,229,171,0.10)');
  glow.addColorStop(1, 'rgba(46,196,182,0.04)');
  ctx.fillStyle = glow;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

function bamboo(ctx: Ctx, size: number): void {
  const rand = seeded(313);
  for (let i = 0; i < 6; i += 1) {
    const x = size * (0.12 + i * 0.15) + rand() * 8;
    const h = size * (0.45 + rand() * 0.4);
    const w = 6 + rand() * 4;
    panel(ctx, x, size - h, w, h, 'rgba(46,196,182,0.28)', 'rgba(11,12,16,0.15)', 2);
    ctx.strokeStyle = 'rgba(5,5,7,0.5)';
    ctx.lineWidth = 2;
    for (let j = 1; j < 4; j += 1) {
      const gy = size - h + (h / 4) * j;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(46,196,182,0.35)';
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 3; j += 1) {
      const ly = size - h + 10 + j * 18;
      ctx.beginPath();
      ctx.moveTo(x + w, ly);
      ctx.lineTo(x + w + 18, ly - 8);
      ctx.stroke();
    }
  }
}

function stain(ctx: Ctx, size: number): void {
  const rand = seeded(317);
  const c = size / 2;
  ctx.fillStyle = 'rgba(5,5,7,0.75)';
  ctx.beginPath();
  for (let i = 0; i < 22; i += 1) {
    const angle = (i / 22) * Math.PI * 2;
    const radius = size * (0.12 + rand() * 0.22);
    const x = c + Math.cos(angle) * radius;
    const y = c + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 14; i += 1) {
    ctx.globalAlpha = 0.3 + rand() * 0.4;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 1 + rand() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createArenaSprites(): ArenaSpriteSet {
  return {
    torii: texture(384, torii),
    lantern: texture(192, lantern),
    shoji: texture(256, shoji),
    bamboo: texture(320, bamboo),
    stain: texture(192, stain),
  };
}
