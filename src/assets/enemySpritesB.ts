/** Samurai, archer and oni boss silhouettes. */

import { PALETTE as P } from './palette';
import type { EnemyDraw } from './enemyDraw';
import { body, eye, spots, stroke } from './enemyDraw';
import type { Point } from './inkCanvas';

export const samuraiDraw: EnemyDraw = (ctx, flash) => {
  const bodyPoints: Point[] = [
    [22, 82],
    [26, 56],
    [34, 44],
    [62, 44],
    [70, 56],
    [74, 82],
  ];
  body(ctx, bodyPoints, P.gold, '#6b5313', P.bone, 521, flash);

  ctx.fillStyle = flash ? P.bone : '#3d2c10';
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, 34, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    ctx.fillStyle = P.goldLight;
    ctx.beginPath();
    ctx.moveTo(36, 24);
    ctx.lineTo(30, 8);
    ctx.lineTo(43, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60, 24);
    ctx.lineTo(66, 8);
    ctx.lineTo(53, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    eye(ctx, 43, 35, 2.4, 1.3, P.crimson);
    eye(ctx, 53, 35, 2.4, 1.3, P.crimson);
    stroke(ctx, [[35, 60], [61, 60]], P.goldLight, 3);
    stroke(ctx, [[40, 69], [56, 69]], P.goldLight, 2);
    stroke(ctx, [[64, 54], [82, 34]], P.bone, 3);
    stroke(ctx, [[64, 56], [80, 38]], P.ash, 1.2);
  }

  stroke(ctx, [[38, 82], [34, 94]], flash ? P.bone : P.ash, 6);
  stroke(ctx, [[58, 82], [62, 94]], flash ? P.bone : P.ash, 6);
  if (!flash) spots(ctx, [[26, 76], [70, 76], [48, 46]], P.gold, 523);
};

export const archerDraw: EnemyDraw = (ctx, flash) => {
  const torso: Point[] = [
    [30, 80],
    [30, 58],
    [40, 46],
    [56, 46],
    [66, 58],
    [66, 80],
  ];
  body(ctx, torso, P.jade, '#155f58', P.goldLight, 529, flash);

  ctx.fillStyle = flash ? P.bone : '#0f3038';
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, 35, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    eye(ctx, 44, 35, 2, 1.2, P.goldLight);
    eye(ctx, 52, 35, 2, 1.2, P.goldLight);
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(18, 60, 22, -1.1, 1.1);
    ctx.stroke();
    ctx.strokeStyle = P.jade;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(18, 60, 22, -1.1, 1.1);
    ctx.stroke();
    stroke(ctx, [[34, 70], [58, 54]], P.bone, 2.2);
    stroke(ctx, [[36, 66], [52, 66]], P.ash, 4);
    stroke(ctx, [[62, 50], [74, 38]], P.goldLight, 3);
  }

  stroke(ctx, [[38, 80], [34, 92]], flash ? P.bone : P.ash, 5);
  stroke(ctx, [[56, 80], [60, 92]], flash ? P.bone : P.ash, 5);
  if (!flash) spots(ctx, [[32, 74], [64, 74], [48, 48]], P.jade, 531);
};

export const bossDraw: EnemyDraw = (ctx, flash) => {
  const shoulders: Point[] = [
    [22, 108],
    [26, 70],
    [44, 54],
    [76, 54],
    [94, 70],
    [98, 108],
  ];
  body(ctx, shoulders, '#5c0f18', P.ink, P.gold, 541, flash);

  if (!flash) {
    const aura = ctx.createRadialGradient(60, 48, 4, 60, 48, 54);
    aura.addColorStop(0, 'rgba(230,57,70,0.45)');
    aura.addColorStop(1, 'rgba(230,57,70,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, 144, 144);
  }

  ctx.fillStyle = flash ? P.bone : P.bone;
  ctx.strokeStyle = P.outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(60, 46, 24, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = flash ? P.bone : P.gold;
  ctx.beginPath();
  ctx.moveTo(42, 32);
  ctx.lineTo(30, 6);
  ctx.lineTo(52, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(78, 32);
  ctx.lineTo(90, 6);
  ctx.lineTo(68, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    eye(ctx, 50, 44, 4, 2.2, P.crimson);
    eye(ctx, 70, 44, 4, 2.2, P.crimson);
    ctx.fillStyle = P.outline;
    ctx.beginPath();
    ctx.moveTo(48, 56);
    ctx.lineTo(60, 66);
    ctx.lineTo(72, 56);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.crimson;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 58);
    ctx.lineTo(60, 64);
    ctx.lineTo(70, 58);
    ctx.stroke();
    stroke(ctx, [[36, 76], [48, 88], [60, 80]], P.goldLight, 4);
    stroke(ctx, [[84, 76], [72, 88], [60, 80]], P.goldLight, 4);
    spots(ctx, [[30, 100], [90, 100], [60, 54]], P.gold, 547);
  }

  stroke(ctx, [[42, 106], [36, 126]], flash ? P.bone : P.ash, 8);
  stroke(ctx, [[78, 106], [84, 126]], flash ? P.bone : P.ash, 8);
};
