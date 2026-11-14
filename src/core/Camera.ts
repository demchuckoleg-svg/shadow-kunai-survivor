/**
 * Камера: плавное слежение, зум ульты и screen-shake. Без зависимостей от Pixi.
 * Зависимости: нет.
 */

export interface CameraTarget {
  x: number;
  y: number;
}

export interface CameraRenderState {
  x: number;
  y: number;
  zoom: number;
  shakeX: number;
  shakeY: number;
}

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  targetZoom = 1;
  followLerp = 10;
  zoomLerp = 8;

  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeMagnitude = 0;
  private shakeX = 0;
  private shakeY = 0;

  snapTo(target: CameraTarget): void {
    this.x = target.x;
    this.y = target.y;
  }

  follow(target: CameraTarget, dt: number): void {
    const t = Math.min(1, dt * this.followLerp);
    this.x += (target.x - this.x) * t;
    this.y += (target.y - this.y) * t;
  }

  /** Импульс тряски: magnitude — амплитуда в пикселях. */
  shake(magnitude: number, duration = 0.25): void {
    if (magnitude <= 0 || duration <= 0) return;
    // Не даём мелким ударам перебивать крупную тряску.
    if (magnitude >= this.shakeMagnitude || this.shakeTime <= 0) {
      this.shakeMagnitude = magnitude;
      this.shakeDuration = duration;
      this.shakeTime = duration;
    }
  }

  setZoom(zoom: number, instant = false): void {
    this.targetZoom = zoom;
    if (instant) this.zoom = zoom;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  update(dt: number): void {
    const zoomT = Math.min(1, dt * this.zoomLerp);
    this.zoom += (this.targetZoom - this.zoom) * zoomT;

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const falloff = this.shakeDuration > 0 ? this.shakeTime / this.shakeDuration : 0;
      const amplitude = this.shakeMagnitude * falloff * falloff;
      this.shakeX = (Math.random() * 2 - 1) * amplitude;
      this.shakeY = (Math.random() * 2 - 1) * amplitude;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeMagnitude = 0;
    }
  }

  get state(): CameraRenderState {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
    };
  }

  worldToScreen(worldX: number, worldY: number, screenW: number, screenH: number): CameraTarget {
    return {
      x: (worldX - this.x) * this.zoom + screenW / 2 + this.shakeX,
      y: (worldY - this.y) * this.zoom + screenH / 2 + this.shakeY,
    };
  }

  screenToWorld(screenX: number, screenY: number, screenW: number, screenH: number): CameraTarget {
    return {
      x: (screenX - screenW / 2 - this.shakeX) / this.zoom + this.x,
      y: (screenY - screenH / 2 - this.shakeY) / this.zoom + this.y,
    };
  }
}
