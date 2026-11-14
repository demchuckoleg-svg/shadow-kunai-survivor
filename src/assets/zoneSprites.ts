/** Ground-zone textures: toxic smoke, lava, caltrops, bamboo, vortex, ice. */

import type { Texture } from 'pixi.js';
import type { ZoneKind } from '@/types/game';
import { PALETTE as P } from './palette';
import { polygon, seeded, splatter, texture, type Ctx } from './inkCanvas';

function smoke(ctx: Ctx, size: number): void {
  const rand = seeded(211);
  const blobs = 7;
  for (let i = 0; i < blobs; i += 1) {
    const x = size / 2 + (rand() * 2 - 1) * size * 0.22;
    const y = size / 2 + (rand() * 2 - 1) * size * 0.18;
    const r = size * (0.14 + rand() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tint = i % 3 === 0 ? 'rgba(46,196,182,0.42)' : 'rgba(141,153,174,0.3)';
    g.addColorStop(0, tint);
    g.addColorStop(0.65, 'rgba(20,22,29,0.22)');
    g.addColorStop(1, 'rgba(11,12,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(5,5,7,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0.2, Math.PI * 1.4);
    ctx.stroke();
  }
  for (let i = 0; i < 10; i += 1) {
    ctx.globalAlpha = 0.25 + rand() * 0.4;
    ctx.fillStyle = i % 3 === 0 ? P.goldLight : P.jade;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 1 + rand() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  splatter(ctx, [[size * 0.3, size * 0.3], [size * 0.7, size * 0.3], [size * 0.3, size * 0.7], [size * 0.7, size * 0.7]], P.jade, 223);
}

function lava(ctx: Ctx, size: number): void {
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size * 0.46);
  g.addColorStop(0, 'rgba(243,229,171,0.85)');
  g.addColorStop(0.35, 'rgba(230,57,70,0.7)');
  g.addColorStop(0.8, 'rgba(125,22,32,0.45)');
  g.addColorStop(1, 'rgba(11,12,16,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const rand = seeded(227);
  ctx.strokeStyle = 'rgba(5,5,7,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const a = rand() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.lineTo(size / 2 + Math.cos(a) * size * 0.4, size / 2 + Math.sin(a) * size * 0.4);
    ctx.stroke();
  }
}

function spikes(ctx: Ctx, size: number): void {
  const rand = seeded(229);
  for (let i = 0; i < 7; i += 1) {
    const x = size * (0.2 + rand() * 0.6);
    const y = size * (0.2 + rand() * 0.6);
    const r = size * 0.09;
    const points = polygon(r, 4, rand() * Math.PI);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = i % 2 === 0 ? P.ash : P.bone;
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function bambooWall(ctx: Ctx, size: number): void {
  for (let i = 0; i < 6; i += 1) {
    const x = size * (0.14 + i * 0.14);
    const h = size * (0.55 + (i % 3) * 0.1);
    ctx.fillStyle = P.jade;
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4, size);
    ctx.lineTo(x - 4, size - h);
    ctx.lineTo(x, size - h - 18);
    ctx.lineTo(x + 4, size - h);
    ctx.lineTo(x + 4, size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(5,5,7,0.5)';
    ctx.beginPath();
    ctx.moveTo(x - 4, size - h * 0.55);
    ctx.lineTo(x + 4, size - h * 0.55);
    ctx.stroke();
  }
}

function vortex(ctx: Ctx, size: number): void {
  const c = size / 2;
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.strokeStyle = ring === 0 ? P.goldLight : 'rgba(46,196,182,0.5)';
    ctx.lineWidth = 3 - ring * 0.6;
    ctx.beginPath();
    for (let i = 0; i <= 48; i += 1) {
      const t = i / 48;
      const angle = t * Math.PI * 4 + ring * 0.9;
      const radius = size * (0.08 + t * 0.32) * (1 - ring * 0.18);
      const x = c + Math.cos(angle) * radius;
      const y = c + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function iceStorm(ctx: Ctx, size: number): void {
  const c = size / 2;
  const rand = seeded(233);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const distance = size * (0.18 + rand() * 0.22);
    const x = c + Math.cos(angle) * distance;
    const y = c + Math.sin(angle) * distance;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = P.jade;
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-3.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(46,196,182,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(c, c, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function createZoneTextures(): Record<ZoneKind, Texture> {
  return {
    smoke: texture(128, smoke),
    lava: texture(128, lava),
    spikes: texture(128, spikes),
    bambooWall: texture(128, bambooWall),
    vortex: texture(128, vortex),
    iceStorm: texture(128, iceStorm),
  };
}
