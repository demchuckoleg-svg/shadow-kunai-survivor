/**
 * Микро-синтезатор на WebAudio: звуки без аудиофайлов (в духе ZzFX).
 * Зависимости: нет.
 */

type Tone = {
  freq: number;
  endFreq?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
};

const MAX_VOLUME = 0.45;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastHit = 0;
  private lastXp = 0;
  private muted = false;

  /** Создаёт/будит AudioContext. Вызывать из пользовательского жеста. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = MAX_VOLUME;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoise();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : MAX_VOLUME;
  }

  private createNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private tone(opts: Tone): void {
    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.muted) return;

    const start = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(Math.max(20, opts.freq), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq ?? opts.freq), start + opts.duration);
    const volume = opts.volume ?? 0.1;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + opts.duration + 0.03);
  }

  private noise(duration: number, volume: number, frequency: number, delay = 0): void {
    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.noiseBuffer || this.muted) return;

    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  playHit(crit: boolean): void {
    const now = performance.now() / 1000;
    if (now - this.lastHit < 0.035) return;
    this.lastHit = now;
    if (crit) {
      this.tone({ freq: 1300, endFreq: 320, duration: 0.11, type: 'sawtooth', volume: 0.075 });
      this.noise(0.08, 0.06, 2400);
    } else {
      this.noise(0.05, 0.045, 1500);
      this.tone({ freq: 220, endFreq: 120, duration: 0.05, type: 'square', volume: 0.03 });
    }
  }

  playThrow(): void {
    this.tone({ freq: 980, endFreq: 380, duration: 0.07, type: 'triangle', volume: 0.04 });
  }

  playXp(): void {
    const now = performance.now() / 1000;
    if (now - this.lastXp < 0.05) return;
    this.lastXp = now;
    this.tone({ freq: 720, endFreq: 1080, duration: 0.07, type: 'sine', volume: 0.035 });
  }

  playLevelUp(): void {
    this.tone({ freq: 520, duration: 0.1, type: 'triangle', volume: 0.08 });
    this.tone({ freq: 780, duration: 0.12, type: 'triangle', volume: 0.08, delay: 0.09 });
    this.tone({ freq: 1040, duration: 0.18, type: 'triangle', volume: 0.09, delay: 0.18 });
  }

  playHurt(): void {
    this.tone({ freq: 240, endFreq: 80, duration: 0.2, type: 'square', volume: 0.09 });
    this.noise(0.12, 0.06, 700);
  }

  playBoss(): void {
    this.tone({ freq: 70, endFreq: 36, duration: 0.7, type: 'sawtooth', volume: 0.12 });
    this.noise(0.5, 0.05, 260);
  }

  playUltimate(): void {
    this.tone({ freq: 90, endFreq: 32, duration: 0.9, type: 'sawtooth', volume: 0.14 });
    this.noise(0.7, 0.08, 900);
    this.tone({ freq: 420, endFreq: 1400, duration: 0.45, type: 'triangle', volume: 0.08, delay: 0.15 });
  }

  playSynergy(): void {
    this.tone({ freq: 320, endFreq: 640, duration: 0.2, type: 'sine', volume: 0.1 });
    this.tone({ freq: 640, endFreq: 1280, duration: 0.3, type: 'sine', volume: 0.09, delay: 0.16 });
    this.noise(0.35, 0.05, 3200);
  }
}
