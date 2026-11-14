/**
 * Hit-stop time dilation and directional camera impacts.
 * Game feel only: no gameplay state is mutated.
 */

import type { Camera } from '@/core/Camera';

const STOP_TIME_SCALE = 0.05;

export class JuiceController {
  private stopRemaining = 0;

  constructor(private readonly camera: Camera) {}

  /** Freeze simulation for a few real milliseconds. */
  hitStop(seconds = 0.035): void {
    this.stopRemaining = Math.max(this.stopRemaining, seconds);
  }

  /** Directional camera punch; optionally with hit-stop. */
  impact(magnitude: number, dirX = 0, dirY = 0, stop = 0): void {
    this.camera.shake(magnitude, 0.22, dirX, dirY);
    if (stop > 0) this.hitStop(stop);
  }

  /** Returns the simulation time scale for the next frame. */
  tick(realDt: number): number {
    if (this.stopRemaining <= 0) return 1;
    this.stopRemaining = Math.max(0, this.stopRemaining - realDt);
    return STOP_TIME_SCALE;
  }
}
