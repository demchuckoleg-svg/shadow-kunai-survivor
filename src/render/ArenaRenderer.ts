/**
 * Arena: tiled ink-dojo floor, faint enso seal, drifting ash motes.
 * The CSS layer adds the vignette and paper grain on top.
 */

import { Container, Sprite, TilingSprite } from 'pixi.js';
import type { Camera } from '@/core/Camera';
import { PALETTE as P } from '@/assets/palette';
import { seeded, texture, type Ctx } from '@/assets/inkCanvas';
import { createArenaSprites } from '@/assets/arenaSprites';
import type { ProceduralSprites } from '@/assets/ProceduralSprites';

const ARENA_HALF = 3400;
const MOTE_COUNT = 42;

interface Mote {
  sprite: Sprite;
  vx: number;
  vy: number;
  phase: number;
}

function drawFloor(ctx: Ctx, size: number): void {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(20,22,29,0.9)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(141,153,174,0.05)';
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }

  const rand = seeded(97);
  for (let i = 0; i < 26; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.4 + rand() * 1.6;
    ctx.globalAlpha = 0.12 + rand() * 0.18;
    ctx.fillStyle = rand() > 0.7 ? P.jade : P.ash;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEnso(ctx: Ctx, size: number): void {
  ctx.translate(size / 2, size / 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.36, -0.4, Math.PI * 1.62);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.22)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.41, 0.3, Math.PI * 1.4);
  ctx.stroke();
}

export class ArenaRenderer {
  readonly container = new Container();
  private readonly floor: TilingSprite;
  private readonly farLayer = new Container();
  private readonly nearLayer = new Container();
  private readonly motes: Mote[] = [];

  constructor(sprites: ProceduralSprites) {
    const tile = texture(256, drawFloor);
    this.floor = new TilingSprite({ texture: tile, width: ARENA_HALF * 2, height: ARENA_HALF * 2 });
    this.floor.position.set(-ARENA_HALF, -ARENA_HALF);

    const enso = texture(512, drawEnso);
    const seal = new Sprite(enso);
    seal.anchor.set(0.5);
    seal.position.set(0, 0);
    seal.alpha = 0.14;

    const decor = createArenaSprites();
    this.addSprite(this.farLayer, decor.torii, -760, -860, 1.05, 0.5, 0);
    this.addSprite(this.farLayer, decor.torii, 1180, 940, 0.9, 0.42, 0.06);
    this.addSprite(this.farLayer, decor.shoji, -980, 380, 1.1, 0.38, 0);
    this.addSprite(this.farLayer, decor.shoji, 1060, -220, 0.9, 0.34, 0);
    this.addSprite(this.farLayer, decor.bamboo, -1380, -380, 1.2, 0.5, 0);
    this.addSprite(this.farLayer, decor.bamboo, 1420, -820, 1.15, 0.46, 0);
    this.addSprite(this.farLayer, decor.bamboo, 1260, 1180, 1.05, 0.42, 0);

    this.addSprite(this.nearLayer, decor.lantern, -360, 420, 0.9, 0.9, 0);
    this.addSprite(this.nearLayer, decor.lantern, 390, -520, 0.85, 0.9, 0);
    this.addSprite(this.nearLayer, decor.lantern, -620, -240, 0.7, 0.8, 0);

    for (let i = 0; i < 12; i += 1) {
      const rand = seeded(401 + i);
      const x = (rand() * 2 - 1) * 1350;
      const y = (rand() * 2 - 1) * 1350;
      this.addSprite(this.nearLayer, decor.stain, x, y, 0.8 + rand() * 1.4, 0.55, rand() * Math.PI);
    }

    this.container.addChild(this.floor, this.farLayer, seal, this.nearLayer);

    const rand = seeded(131);
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      const sprite = new Sprite(sprites.mote);
      sprite.anchor.set(0.5);
      sprite.scale.set(0.5 + rand() * 1.2);
      sprite.alpha = 0.12 + rand() * 0.3;
      sprite.tint = rand() > 0.72 ? 0xe63946 : 0xf1faee;
      const mote: Mote = {
        sprite,
        vx: -6 - rand() * 14,
        vy: -4 - rand() * 12,
        phase: rand() * Math.PI * 2,
      };
      this.motes.push(mote);
      this.container.addChild(sprite);
    }
  }

  private addSprite(
    layer: Container,
    tex: import('pixi.js').Texture,
    x: number,
    y: number,
    scale: number,
    alpha: number,
    rotation: number,
  ): void {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.scale.set(scale);
    sprite.alpha = alpha;
    sprite.rotation = rotation;
    layer.addChild(sprite);
  }

  update(dt: number, camera: Camera, screenW: number, screenH: number, time: number): void {
    this.farLayer.position.set(camera.x * 0.08, camera.y * 0.08);
    this.nearLayer.position.set(camera.x * 0.025, camera.y * 0.025);
    const halfW = screenW / (2 * Math.max(0.4, camera.zoom)) + 80;
    const halfH = screenH / (2 * Math.max(0.4, camera.zoom)) + 80;
    const left = camera.x - halfW;
    const right = camera.x + halfW;
    const top = camera.y - halfH;
    const bottom = camera.y + halfH;

    for (const mote of this.motes) {
      mote.sprite.x += mote.vx * dt;
      mote.sprite.y += mote.vy * dt;
      mote.sprite.alpha = 0.1 + Math.abs(Math.sin(time * 0.6 + mote.phase)) * 0.26;
      if (mote.sprite.x < left) mote.sprite.x = right;
      if (mote.sprite.x > right) mote.sprite.x = left;
      if (mote.sprite.y < top) mote.sprite.y = bottom;
      if (mote.sprite.y > bottom) mote.sprite.y = top;
    }
  }
}
