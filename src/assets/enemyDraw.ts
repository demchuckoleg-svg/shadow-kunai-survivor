/** Shared canvas primitives for enemy silhouettes and hit-flash variants. */

import { PALETTE as P } from './palette';
import { inkShape, splatter, trace, type Ctx, type Point } from './inkCanvas';

export type EnemyDraw = (ctx: Ctx, flash: boolean) => void;

export function body(
  ctx: Ctx,
  points: readonly Point[],
  top: string,
  bottom: string,
  accent: string,
  seed: number,
  flash: boolean,
): void {
  if (flash) {
    ctx.fillStyle = P.bone;
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 3;
    trace(ctx, points);
    ctx.fill();
    ctx.stroke();
    return;
  }
  inkShape(ctx, points, top, bottom, accent, seed);
}

export function stroke(ctx: Ctx, points: readonly Point[], color: string, width: number): void {
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = width + 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}

export function eye(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = P.outline;
  ctx.beginPath();
  ctx.ellipse(x, y, w + 1.5, h + 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function spots(ctx: Ctx, points: readonly Point[], color: string, seed: number): void {
  splatter(ctx, points, color, seed);
}
