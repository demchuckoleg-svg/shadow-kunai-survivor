/**
 * Центральное состояние забега. Только данные + события, без рендера и DOM.
 * Зависимости: @/types/game.
 */

import type {
  GameEvent,
  GameEventHandler,
  GameEventType,
  InputState,
  PlayerState,
  RunPhase,
  RunStats,
  SkillId,
  SynergyId,
  SkillInstance,
  UltimateState,
  RunTimer,
} from '@/types/game';
import { ULTIMATE_CONFIG } from '@/data/ultimate';

export const MAX_SKILL_LEVEL = 10;
export const MAX_CHARACTER_LEVEL = 50;
export const SKILL_SLOTS = 5;

export function createInputState(): InputState {
  return {
    moveX: 0,
    moveY: 0,
    active: false,
    pointerId: -1,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
  };
}

export function createPlayerState(): PlayerState {
  return {
    id: 0,
    active: true,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 100,
    maxHp: 100,
    speed: 220,
    level: 1,
    xp: 0,
    nextLevelXp: 5,
    pickupRadius: 70,
    critChance: 0.05,
    critMult: 1.6,
    armor: 0,
    ultCharge: 0,
    ultUnlocked: false,
    invulnTimer: 0,
    speedBoostTimer: 0,
    attackSpeedBuffTimer: 0,
    facingX: 0,
    facingY: 1,
    alive: true,
  };
}

export function createSkillInstance(id: SkillId, level = 1): SkillInstance {
  return {
    id,
    level,
    cooldownTimer: 0,
    augmentsUnlocked: {},
    isEvolved: false,
    evolvedFrom: [],
    totalDamageDealt: 0,
    hitCount: 0,
    critCount: 0,
  };
}

export function createUltimateState(): UltimateState {
  return {
    phase: 'IDLE',
    timer: 0,
    barrageTimer: 0,
    bonusTimeUsed: 0,
    primaryTargetId: -1,
    kunaiTimer: 0,
    slashTimer: 0,
    active: false,
  };
}

export function createRunStats(): RunStats {
  return {
    survivalTime: 0,
    kills: 0,
    level: 1,
    totalDamage: 0,
    bestCombo: 0,
    perSkill: {},
  };
}

export class GameState {
  phase: RunPhase = 'menu';
  readonly input: InputState = createInputState();
  player: PlayerState = createPlayerState();
  skills: SkillInstance[] = [];
  synergies: SynergyId[] = [];
  ultimate: UltimateState = createUltimateState();
  timer: RunTimer = { elapsed: 0, minute: 0 };
  kills = 0;
  stats: RunStats = createRunStats();

  private readonly listeners = new Set<GameEventHandler>();

  on(handler: GameEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  emit(type: GameEventType, payload?: unknown): void {
    const event: GameEvent = payload === undefined ? { type } : { type, payload };
    for (const listener of this.listeners) listener(event);
  }

  get elapsed(): number {
    return this.timer.elapsed;
  }

  get isRunning(): boolean {
    return this.phase === 'playing';
  }

  startRun(loadout: readonly SkillId[]): void {
    this.phase = 'draft';
    this.skills = loadout.slice(0, SKILL_SLOTS).map((id) => createSkillInstance(id));
    this.synergies = [];
    this.player = createPlayerState();
    this.ultimate = createUltimateState();
    this.timer = { elapsed: 0, minute: 0 };
    this.kills = 0;
    this.stats = createRunStats();
    this.resetInput();
    this.phase = 'playing';
  }

  resetInput(): void {
    const input = this.input;
    input.moveX = 0;
    input.moveY = 0;
    input.active = false;
    input.pointerId = -1;
  }

  update(dt: number): void {
    if (this.phase !== 'playing') return;
    this.timer.elapsed += dt;
    this.timer.minute = Math.floor(this.timer.elapsed / 60);
    this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);
    this.player.speedBoostTimer = Math.max(0, this.player.speedBoostTimer - dt);
    this.player.attackSpeedBuffTimer = Math.max(0, this.player.attackSpeedBuffTimer - dt);
    // Пассивная зарядка ульты: 100% за passiveChargeSeconds.
    if (this.player.ultUnlocked) {
      this.player.ultCharge = Math.min(
        100,
        this.player.ultCharge + (100 / ULTIMATE_CONFIG.passiveChargeSeconds) * dt,
      );
    }
  }

  addXp(value: number): void {
    this.player.xp += value;
    this.emit('xpGained', { value, total: this.player.xp });
  }

  addKill(): void {
    this.kills += 1;
    this.stats.kills = this.kills;
  }

  addUltCharge(value: number): void {
    if (!this.player.ultUnlocked) return;
    this.player.ultCharge = Math.min(100, this.player.ultCharge + value);
  }

  getSkill(id: SkillId): SkillInstance | undefined {
    return this.skills.find((skill) => skill.id === id);
  }

  hasSkill(id: SkillId): boolean {
    return this.skills.some((skill) => skill.id === id);
  }

  finishRun(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.player.alive = false;
    this.stats.survivalTime = this.timer.elapsed;
    this.stats.level = this.player.level;
    this.emit('runEnded', this.stats);
  }
}
