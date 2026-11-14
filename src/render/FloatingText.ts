/**
 * Пул вылетающих цифр урона: белые обычные, крупные красно-золотые криты.
 * Зависимости: pixi.js, World.
 */

import { Container, Text, TextStyle } from 'pixi.js';
import type { World } from '@/core/World';

const GRAVITY = 120;

export class FloatingTextRenderer {
  readonly container = new Container();
  private readonly texts: Text[] = [];
  private readonly lastLife: number[] = [];
  private readonly lastCrit: boolean[] = [];
  private readonly normalStyle = new TextStyle({
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: 15,
    fontWeight: '700',
    fill: 0xf4f4f8,
    stroke: { color: 0x05050a, width: 3 },
  });
  private readonly critStyle = new TextStyle({
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: 23,
    fontWeight: '900',
    fill: 0xffc94a,
    stroke: { color: 0x4d0f1a, width: 4 },
  });

  constructor(private readonly world: World) {
    this.container.sortableChildren = true;
    for (let i = 0; i < world.damageTexts.capacity; i += 1) {
      const text = new Text({ text: '', style: this.normalStyle, resolution: 2 });
      text.anchor.set(0.5);
      text.visible = false;
      this.texts.push(text);
      this.lastLife.push(0);
      this.lastCrit.push(false);
      this.container.addChild(text);
    }
  }

  update(dt: number): void {
    const items = this.world.damageTexts.items;
    for (let i = 0; i < items.length; i += 1) {
      const data = items[i];
      const text = this.texts[i];
      if (!data || !text) continue;

      if (!data.active || data.life <= 0) {
        text.visible = false;
        this.lastLife[i] = 0;
        if (data.active) this.world.damageTexts.release(data);
        continue;
      }

      const previousLife = this.lastLife[i] ?? 0;
      if (data.life > previousLife) {
        text.text = String(data.value);
        if (this.lastCrit[i] !== data.crit) {
          this.lastCrit[i] = data.crit;
          text.style = data.crit ? this.critStyle : this.normalStyle;
        }
      }
      this.lastLife[i] = data.life;

      data.life = Math.max(0, data.life - dt);
      data.x += data.vx * dt;
      data.y += data.vy * dt;
      data.vy += GRAVITY * dt;

      const progress = 1 - data.life / Math.max(0.001, data.maxLife);
      text.visible = true;
      text.position.set(data.x, data.y);
      text.alpha = progress > 0.7 ? (1 - progress) / 0.3 : 1;
      text.scale.set(data.scale * (1 + progress * 0.08));
      text.zIndex = data.y;
    }
  }
}
