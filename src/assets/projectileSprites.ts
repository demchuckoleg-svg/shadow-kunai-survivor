/** Projectile textures: blades, shards, flames, crow and water dragon. */

import type { Texture } from 'pixi.js';
import type { ProjectileKind } from '@/types/game';
import { PALETTE as P } from './palette';
import { inkShape, polygon, star, texture } from './inkCanvas';

function kunai(blade: string, accent: string): Texture {
  return texture(36, (ctx) => {
    inkShape(ctx, [[28, 18], [11, 13], [15, 18], [11, 23]], P.bone, blade, accent, 53);
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, 18);
    ctx.lineTo(6, 18);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(28, 18, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function shuriken(color: string): Texture {
  return texture(40, (ctx) => {
    ctx.save();
    ctx.translate(20, 20);
    inkShape(ctx, star(16, 5, 4), P.bone, color, P.goldLight, 59);
    ctx.fillStyle = P.outline;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.goldLight;
    ctx.beginPath();
    ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function crescent(color: string): Texture {
  return texture(48, (ctx) => {
    const g = ctx.createLinearGradient(8, 8, 40, 40);
    g.addColorStop(0, P.bone);
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(230,57,70,0)');
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(24, 24, 16, -1.15, 1.15);
    ctx.stroke();
    ctx.strokeStyle = g;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(24, 24, 16, -1.15, 1.15);
    ctx.stroke();
  });
}

function needles(color: string): Texture {
  return texture(40, (ctx) => {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const offset = i * 4;
      ctx.strokeStyle = P.outline;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8 + offset, 32 - offset);
      ctx.lineTo(30 + offset, 10 - offset);
      ctx.stroke();
      ctx.strokeStyle = i === 1 ? color : P.bone;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8 + offset, 32 - offset);
      ctx.lineTo(30 + offset, 10 - offset);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(31, 10, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function fireball(): Texture {
  return texture(48, (ctx) => {
    const g = ctx.createRadialGradient(24, 22, 2, 24, 24, 20);
    g.addColorStop(0, P.bone);
    g.addColorStop(0.35, P.goldLight);
    g.addColorStop(0.7, P.crimson);
    g.addColorStop(1, 'rgba(230,57,70,0.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(24, 24, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 24, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = P.bone;
    ctx.beginPath();
    ctx.arc(20, 18, 3.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function shard(color: string): Texture {
  return texture(32, (ctx) => {
    ctx.save();
    ctx.translate(16, 16);
    inkShape(ctx, polygon(10, 4), P.bone, color, P.bone, 67);
    ctx.restore();
  });
}

function flame(color: string): Texture {
  return texture(40, (ctx) => {
    const g = ctx.createRadialGradient(20, 22, 1, 20, 20, 16);
    g.addColorStop(0, P.bone);
    g.addColorStop(0.45, color);
    g.addColorStop(1, 'rgba(46,196,182,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(20, 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.goldLight;
    ctx.beginPath();
    ctx.arc(20, 18, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function crow(): Texture {
  return texture(40, (ctx) => {
    ctx.save();
    ctx.translate(20, 20);
    inkShape(ctx, [[16, 0], [-2, -10], [1, 0], [-2, 10]], P.ash, P.slate, P.crimson, 71);
    ctx.fillStyle = P.crimson;
    ctx.beginPath();
    ctx.arc(8, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function serpent(): Texture {
  return texture(64, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, 'rgba(46,196,182,0.1)');
    g.addColorStop(0.5, P.jade);
    g.addColorStop(1, P.goldLight);
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 46);
    ctx.bezierCurveTo(24, 46, 18, 22, 34, 20);
    ctx.bezierCurveTo(48, 18, 46, 36, 58, 30);
    ctx.stroke();
    ctx.strokeStyle = g;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(8, 46);
    ctx.bezierCurveTo(24, 46, 18, 22, 34, 20);
    ctx.bezierCurveTo(48, 18, 46, 36, 58, 30);
    ctx.stroke();
    ctx.fillStyle = P.goldLight;
    ctx.beginPath();
    ctx.arc(56, 29, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function createProjectileTextures(): Record<ProjectileKind, Texture> {
  return {
    kunai: kunai(P.bone, P.crimson),
    shuriken: shuriken(P.jade),
    katanaWave: crescent(P.crimson),
    senbon: needles(P.crimson),
    fireball: fireball(),
    iceShard: shard(P.jade),
    needle: needles(P.goldLight),
    soulFire: flame(P.jade),
    phantomKunai: kunai(P.crimson, P.goldLight),
    cloneShot: kunai(P.ash, P.jade),
    crow: crow(),
    waterDragon: serpent(),
    enemyArrow: needles(P.jade),
  };
}
