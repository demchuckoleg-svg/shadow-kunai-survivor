/**
 * Low-level offscreen-canvas helpers for Neo-Edo ink sprites.
 * Four passes: drop shadow, 2px outline, gradient fill with rim light, splatter.
 */

import { CanvasSource, Texture } from 'pixi.js';
import { PALETTE as P } from './palette';

export type Ctx = CanvasRenderingContext2D;
export type Point = readonly [number, number];

const SS = 2;

export function texture(size: number, draw: (ctx: Ctx, size: number) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size * SS;
  canvas.height = size * SS;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context is unavailable');
  ctx.scale(SS, SS);
  draw(ctx, size);
  const source = new CanvasSource({ resource: canvas, resolution: SS, scaleMode: 'linear' });
  return new Texture({ source });
}

export function trace(ctx: Ctx, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

export function seeded(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

export function splatter(ctx: Ctx, points: readonly Point[], color: string, seed: number): void {
  const rand = seeded(seed);
  for (let i = 0; i < 9; i += 1) {
    const anchor = points[Math.floor(rand() * points.length)] ?? [0, 0];
    const angle = rand() * Math.PI * 2;
    const distance = 2 + rand() * 5;
    ctx.globalAlpha = 0.2 + rand() * 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      anchor[0] + Math.cos(angle) * distance,
      anchor[1] + Math.sin(angle) * distance,
      0.5 + rand() * 1.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function inkShape(
  ctx: Ctx,
  points: readonly Point[],
  top: string,
  bottom: string,
  accent: string,
  seed: number,
): void {
  ctx.save();
  ctx.translate(0, 2.6);
  ctx.filter = 'blur(2.2px)';
  ctx.fillStyle = 'rgba(5,5,7,0.55)';
  trace(ctx, points);
  ctx.fill();
  ctx.restore();

  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.6;
  ctx.strokeStyle = P.outline;
  trace(ctx, points);
  ctx.stroke();

  const ys = points.map((point) => point[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const gradient = ctx.createLinearGradient(0, minY, 0, maxY);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.55, bottom);
  gradient.addColorStop(1, P.outline);
  ctx.fillStyle = gradient;
  trace(ctx, points);
  ctx.fill();

  const rim = ctx.createLinearGradient(0, minY, 0, maxY);
  rim.addColorStop(0, 'rgba(241,250,238,0.7)');
  rim.addColorStop(0.35, 'rgba(241,250,238,0.12)');
  rim.addColorStop(1, 'rgba(241,250,238,0)');
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = rim;
  trace(ctx, points);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(0, minY + 2.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  splatter(ctx, points, P.outline, seed);
}

export function polygon(radius: number, sides: number, rotation = -Math.PI / 2): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
}

export function star(outer: number, inner: number, spikes: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
}

export function orb(size: number, core: string, glow: string): Texture {
  return texture(size, (ctx, s) => {
    const c = s / 2;
    const outer = ctx.createRadialGradient(c, c, 1, c, c, s * 0.46);
    outer.addColorStop(0, glow);
    outer.addColorStop(0.45, 'rgba(46,196,182,0.22)');
    outer.addColorStop(1, 'rgba(5,5,7,0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(c, c, s * 0.46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(c, c, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c, c, s * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(241,250,238,0.85)';
    ctx.beginPath();
    ctx.arc(c - s * 0.06, c - s * 0.08, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  });
}
