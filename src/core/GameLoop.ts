/**
 * Игровой цикл с фиксированным шагом 60 Гц и защитой от скачков FPS.
 * Зависимости: @/types/game (FIXED_DT).
 */

import { FIXED_DT } from '@/types/game';

export interface LoopCallbacks {
  /** Симуляция, всегда фиксированный dt. */
  update: (dt: number) => void;
  /** Отрисовка; alpha — интерполяция между тиками 0..1. */
  render: (alpha: number, frameDt: number) => void;
}

export class GameLoop {
  private readonly update: (dt: number) => void;
  private readonly render: (alpha: number, frameDt: number) => void;
  private readonly fixedDt: number;
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private paused = false;
  private maxFrameDt = 0.25;
  /** Simulation dilation for hit-stop effects. */
  timeScale = 1;
  private readonly maxSteps = 5;

  constructor(callbacks: LoopCallbacks, fixedDt = FIXED_DT) {
    this.update = callbacks.update;
    this.render = callbacks.render;
    this.fixedDt = fixedDt;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    let frameDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!Number.isFinite(frameDt) || frameDt < 0) frameDt = 0;
    if (frameDt > this.maxFrameDt) frameDt = this.maxFrameDt;

    if (!this.paused) {
      this.accumulator += frameDt * Math.max(0, this.timeScale);
      let steps = 0;
      while (this.accumulator >= this.fixedDt && steps < this.maxSteps) {
        this.update(this.fixedDt);
        this.accumulator -= this.fixedDt;
        steps += 1;
      }
      // Если не успели — сбрасываем долг, чтобы не было «догоняющей» смерти.
      if (steps >= this.maxSteps) this.accumulator = 0;
    }

    const alpha = Math.min(1, this.accumulator / this.fixedDt);
    this.render(alpha, frameDt);
  };
}
