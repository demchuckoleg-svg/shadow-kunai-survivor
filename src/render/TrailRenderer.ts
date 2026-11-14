/**
 * Ribbon trails for fast player projectiles, built on PIXI.MeshRope.
 * A fixed pool of ropes is reused; no geometry is allocated per frame.
 */

import { Container, MeshRope, Point, type Texture } from 'pixi.js';
import type { World } from '@/core/World';
import type { PlayerState, ProjectileEntity } from '@/types/game';
import { texture } from '@/assets/inkCanvas';

const POOL_SIZE = 84;
const POINTS = 9;
const SEGMENT_LIFE = 0.16;
const MIN_SPEED = 140;

interface Ribbon {
  mesh: MeshRope;
  points: Point[];
  life: number;
}

function ribbonTexture(): Texture {
  return texture(32, (ctx) => {
    const g = ctx.createLinearGradient(0, 8, 0, 24);
    g.addColorStop(0, 'rgba(241,250,238,0)');
    g.addColorStop(0.5, 'rgba(241,250,238,0.85)');
    g.addColorStop(1, 'rgba(241,250,238,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 8, 32, 16);
    ctx.fillStyle = 'rgba(230,57,70,0.5)';
    ctx.fillRect(0, 14, 32, 4);
  });
}

export class TrailRenderer {
  readonly container = new Container();
  private readonly free: Ribbon[] = [];
  private readonly active = new Map<number, Ribbon>();
  private readonly scarfPoints: Point[] = [];
  private readonly scarf: MeshRope;

  constructor(private readonly world: World) {
    this.container.blendMode = 'add';
    const tex = ribbonTexture();

    for (let i = 0; i < POOL_SIZE; i += 1) {
      const points: Point[] = [];
      for (let p = 0; p < POINTS; p += 1) points.push(new Point(0, 0));
      const mesh = new MeshRope({ texture: tex, points, width: 7, textureScale: 0 });
      mesh.visible = false;
      mesh.blendMode = 'add';
      mesh.alpha = 0.6;
      this.container.addChild(mesh);
      this.free.push({ mesh, points, life: 0 });
    }

    for (let i = 0; i < 11; i += 1) this.scarfPoints.push(new Point(0, 0));
    this.scarf = new MeshRope({ texture: tex, points: this.scarfPoints, width: 9, textureScale: 0 });
    this.scarf.tint = 0xe63946;
    this.scarf.alpha = 0.7;
    this.scarf.blendMode = 'add';
    this.container.addChild(this.scarf);
  }

  update(dt: number, player: PlayerState): void {
    this.updateScarf(dt, player);
    const items = this.world.projectiles.items;
    for (let i = 0; i < items.length; i += 1) {
      const projectile = items[i];
      if (!projectile || !projectile.active || projectile.faction !== 'player') continue;
      if (Math.hypot(projectile.vx, projectile.vy) < MIN_SPEED) continue;
      this.follow(projectile);
    }

    for (const [id, ribbon] of this.active) {
      const projectile = this.world.projectiles.items[id];
      const alive = projectile !== undefined && projectile.active;
      if (alive) continue;
      ribbon.life -= dt;
      ribbon.mesh.alpha = Math.max(0, ribbon.life / SEGMENT_LIFE) * 0.55;
      if (ribbon.life <= 0) {
        ribbon.mesh.visible = false;
        this.active.delete(id);
        this.free.push(ribbon);
      }
    }
  }

  private follow(projectile: ProjectileEntity): void {
    let ribbon = this.active.get(projectile.id);
    if (!ribbon) {
      ribbon = this.free.pop();
      if (!ribbon) return;
      ribbon.life = SEGMENT_LIFE;
      for (const point of ribbon.points) point.set(projectile.x, projectile.y);
      ribbon.mesh.tint = projectile.color;
      ribbon.mesh.visible = true;
      ribbon.mesh.alpha = 0.55;
      this.active.set(projectile.id, ribbon);
      return;
    }

    const tailPoint = ribbon.points[ribbon.points.length - 1];
    if (tailPoint && Math.hypot(tailPoint.x - projectile.x, tailPoint.y - projectile.y) > 320) {
      for (const point of ribbon.points) point.set(projectile.x, projectile.y);
    }

    for (let i = 0; i < ribbon.points.length - 1; i += 1) {
      const current = ribbon.points[i];
      const next = ribbon.points[i + 1];
      if (!current || !next) continue;
      current.set(next.x, next.y);
    }
    const tail = ribbon.points[ribbon.points.length - 1];
    if (tail) tail.set(projectile.x, projectile.y);
    ribbon.mesh.tint = projectile.color;
    ribbon.mesh.alpha = 0.55;
    ribbon.life = SEGMENT_LIFE;
  }

  private updateScarf(dt: number, player: PlayerState): void {
    const head = this.scarfPoints[0];
    if (!head) return;
    head.set(player.x, player.y);
    const follow = Math.min(1, dt * 14);
    for (let i = 1; i < this.scarfPoints.length; i += 1) {
      const point = this.scarfPoints[i];
      const previous = this.scarfPoints[i - 1];
      if (!point || !previous) continue;
      point.x += (previous.x - point.x) * follow;
      point.y += (previous.y - point.y) * follow;
    }
    this.scarf.visible = player.alive;
    this.scarf.alpha = player.invulnTimer > 0 ? 0.35 : 0.7;
    this.scarf.scale.set(1);
  }

  clear(): void {
    for (const ribbon of this.active.values()) {
      ribbon.mesh.visible = false;
      this.free.push(ribbon);
    }
    this.active.clear();
  }
}
