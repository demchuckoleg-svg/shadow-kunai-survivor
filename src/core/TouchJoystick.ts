/**
 * Плавающий виртуальный тач-джойстик + WASD для отладки на десктопе.
 * Пишет нормализованный вектор прямо в InputState. DOM-only, без Pixi.
 * Зависимости: @/types/game.
 */

import type { InputState } from '@/types/game';

const MAX_RADIUS = 52;
const DEAD_ZONE = 10;
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [data-ui]';

const KEY_VECTORS: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export class TouchJoystick {
  private readonly input: InputState;
  private readonly root: HTMLDivElement;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private readonly keys = new Set<string>();
  private pointerId = -1;
  private enabled = true;
  private destroyed = false;

  constructor(input: InputState, host: HTMLElement = document.body) {
    this.input = input;

    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden;';

    this.base = document.createElement('div');
    this.base.style.cssText = [
      'position:absolute',
      'width:120px;height:120px',
      'border-radius:9999px',
      'border:2px solid rgba(53,230,255,0.35)',
      'background:radial-gradient(circle, rgba(53,230,255,0.12), rgba(53,230,255,0.03) 70%, transparent)',
      'box-shadow:0 0 28px rgba(53,230,255,0.12) inset',
      'transform:translate(-50%,-50%) scale(0.85)',
      'opacity:0',
      'transition:opacity 120ms ease, transform 120ms ease',
      'pointer-events:none',
    ].join(';');

    this.knob = document.createElement('div');
    this.knob.style.cssText = [
      'position:absolute',
      'left:50%;top:50%',
      'width:48px;height:48px',
      'border-radius:9999px',
      'border:2px solid rgba(255,255,255,0.4)',
      'background:radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(53,230,255,0.25))',
      'box-shadow:0 0 18px rgba(53,230,255,0.5)',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
    ].join(';');

    this.base.appendChild(this.knob);
    this.root.appendChild(this.base);
    host.appendChild(this.root);

    window.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pointerId = -1;
      this.hide();
      this.writeVector(0, 0);
      this.input.active = false;
      this.keys.clear();
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled || this.pointerId !== -1) return;
    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return;

    event.preventDefault();
    this.pointerId = event.pointerId;
    this.keys.clear();
    this.input.active = true;
    this.input.pointerId = event.pointerId;

    const rect = this.root.getBoundingClientRect();
    const ox = event.clientX - rect.left;
    const oy = event.clientY - rect.top;
    this.input.originX = ox;
    this.input.originY = oy;
    this.input.knobX = 0;
    this.input.knobY = 0;
    this.writeVector(0, 0);

    this.base.style.left = `${ox}px`;
    this.base.style.top = `${oy}px`;
    this.base.style.opacity = '1';
    this.base.style.transform = 'translate(-50%,-50%) scale(1)';
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled || event.pointerId !== this.pointerId) return;
    event.preventDefault();

    const rect = this.root.getBoundingClientRect();
    let dx = event.clientX - rect.left - this.input.originX;
    let dy = event.clientY - rect.top - this.input.originY;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_RADIUS) {
      dx = (dx / distance) * MAX_RADIUS;
      dy = (dy / distance) * MAX_RADIUS;
    }

    this.input.knobX = dx;
    this.input.knobY = dy;
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    if (distance < DEAD_ZONE) {
      this.writeVector(0, 0);
      return;
    }
    const norm = Math.max(1e-4, Math.hypot(dx, dy));
    this.writeVector(dx / norm, dy / norm);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    this.input.active = false;
    this.input.pointerId = -1;
    this.input.knobX = 0;
    this.input.knobY = 0;
    this.hide();
    this.writeVector(0, 0);
    this.applyKeyboard();
  };

  private hide(): void {
    this.base.style.opacity = '0';
    this.base.style.transform = 'translate(-50%,-50%) scale(0.85)';
    this.knob.style.transform = 'translate(-50%,-50%)';
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (KEY_VECTORS[event.code] === undefined) return;
    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return;
    event.preventDefault();
    this.keys.add(event.code);
    this.applyKeyboard();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (!this.keys.delete(event.code)) return;
    this.applyKeyboard();
  };

  private onBlur = (): void => {
    this.keys.clear();
    if (this.pointerId === -1) this.writeVector(0, 0);
  };

  private applyKeyboard(): void {
    if (!this.enabled || this.pointerId !== -1) return;
    let x = 0;
    let y = 0;
    for (const code of this.keys) {
      const vec = KEY_VECTORS[code];
      if (vec) {
        x += vec[0];
        y += vec[1];
      }
    }
    const len = Math.hypot(x, y);
    if (len < 1e-4) {
      this.writeVector(0, 0);
      return;
    }
    this.writeVector(x / len, y / len);
    this.input.active = true;
  }

  private writeVector(x: number, y: number): void {
    const len = Math.hypot(x, y);
    if (len > 1) {
      this.input.moveX = x / len;
      this.input.moveY = y / len;
    } else {
      this.input.moveX = x;
      this.input.moveY = y;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.root.remove();
  }
}
