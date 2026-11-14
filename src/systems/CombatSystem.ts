/**
 * Урон, криты, статусы (горение/кровотечение), смерть врагов и дроп.
 * Зависимости: GameState, World, Camera.
 */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { Camera } from '@/core/Camera';
import type { EnemyEntity, SkillId } from '@/types/game';
import { ULT_CHARGE_PER_DAMAGE } from '@/data/ultimate';

export interface DamageOptions {
  critChance?: number;
  critMult?: number;
  sourceSkill?: SkillId | null;
  knockback?: number;
  color?: number;
  ignoreArmor?: boolean;
  showText?: boolean;
}

export interface DamageResult {
  damage: number;
  crit: boolean;
  killed: boolean;
}

const BURN_DPS = 4;
const BLEED_DPS = 2.5;
const HIT_FLASH_TIME = 0.06;

export type KillListener = (enemy: EnemyEntity) => void;

export class CombatSystem {
  private readonly killListeners = new Set<KillListener>();

  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly camera: Camera,
  ) {}

  onKill(listener: KillListener): () => void {
    this.killListeners.add(listener);
    return () => this.killListeners.delete(listener);
  }

  damageEnemy(enemy: EnemyEntity, baseDamage: number, opts: DamageOptions = {}): DamageResult {
    if (!enemy.active || enemy.hp <= 0) {
      return { damage: 0, crit: false, killed: false };
    }

    const critChance = opts.critChance ?? this.state.player.critChance;
    const critMult = opts.critMult ?? this.state.player.critMult;
    const crit = Math.random() < critChance;
    let damage = baseDamage * (crit ? critMult : 1);

    if (!opts.ignoreArmor) damage = Math.max(1, damage - enemy.armor);
    damage = Math.max(1, Math.round(damage));

    enemy.hp -= damage;
    enemy.hitFlashTimer = HIT_FLASH_TIME;

    if (opts.knockback && opts.knockback > 0) {
      const dx = enemy.x - this.state.player.x;
      const dy = enemy.y - this.state.player.y;
      const len = Math.hypot(dx, dy) || 1;
      enemy.x += (dx / len) * opts.knockback;
      enemy.y += (dy / len) * opts.knockback;
    }

    this.state.stats.totalDamage += damage;
    this.state.addUltCharge(damage * ULT_CHARGE_PER_DAMAGE);
    const skill = opts.sourceSkill ? this.state.getSkill(opts.sourceSkill) : undefined;
    if (skill) {
      skill.totalDamageDealt += damage;
      skill.hitCount += 1;
      if (crit) skill.critCount += 1;
      const entry = this.state.stats.perSkill[skill.id] ?? {
        damage: 0,
        hits: 0,
        crits: 0,
        kills: 0,
      };
      entry.damage += damage;
      entry.hits += 1;
      if (crit) entry.crits += 1;
      this.state.stats.perSkill[skill.id] = entry;
    }
    if (opts.showText !== false) {
      this.world.spawnDamageText(enemy.x, enemy.y - enemy.radius, damage, crit, opts.color ?? 0xffffff);
    }
    if (crit) this.camera.shake(2.5, 0.12);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, opts.sourceSkill ?? null);
      return { damage, crit, killed: true };
    }
    return { damage, crit, killed: false };
  }

  applyBurn(enemy: EnemyEntity, duration: number): void {
    enemy.burnTimer = Math.max(enemy.burnTimer, duration);
  }

  applyBleed(enemy: EnemyEntity, duration: number): void {
    enemy.bleedTimer = Math.max(enemy.bleedTimer, duration);
  }

  /** Тик DoT-статусов. Вызывать до EnemySystem, чтобы смерть отработала в том же кадре. */
  updateStatuses(dt: number): void {
    this.world.enemies.forEachActive((enemy) => {
      if (enemy.hp <= 0) return;
      let dot = 0;
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        dot += BURN_DPS;
      }
      if (enemy.bleedTimer > 0) {
        enemy.bleedTimer -= dt;
        dot += BLEED_DPS;
      }
      if (dot <= 0) return;
      enemy.hp -= dot * dt;
      if (enemy.hp <= 0) this.killEnemy(enemy, null);
    });
  }

  killEnemy(enemy: EnemyEntity, sourceSkill: SkillId | null): void {
    if (!enemy.active) return;
    this.state.addKill();
    if (sourceSkill) {
      const skill = this.state.getSkill(sourceSkill);
      const entry = skill
        ? (this.state.stats.perSkill[skill.id] ?? { damage: 0, hits: 0, crits: 0, kills: 0 })
        : null;
      if (entry) {
        entry.kills += 1;
        this.state.stats.perSkill[sourceSkill] = entry;
      }
    }

    this.dropLoot(enemy);

    this.world.spawnVfx({
      kind: 'explosion',
      x: enemy.x,
      y: enemy.y,
      color: enemy.archetype === 'miniBoss' ? 0xff7a1a : 0xffffff,
      life: enemy.archetype === 'miniBoss' ? 0.7 : 0.28,
      radius: enemy.archetype === 'miniBoss' ? 120 : enemy.radius * 1.8,
      width: enemy.archetype === 'miniBoss' ? 8 : 2,
    });
    this.camera.shake(enemy.archetype === 'miniBoss' ? 10 : 2, enemy.archetype === 'miniBoss' ? 0.5 : 0.12);

    for (const listener of this.killListeners) listener(enemy);
    this.world.enemies.release(enemy);
  }

  private dropLoot(enemy: EnemyEntity): void {
    const value = Math.max(1, Math.round(enemy.xpValue));
    if (value >= 10) {
      const orbs = Math.min(4, Math.ceil(value / 8));
      const per = Math.max(1, Math.floor(value / orbs));
      for (let i = 0; i < orbs; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        this.world.dropXp(
          enemy.x + Math.cos(angle) * enemy.radius * 0.6,
          enemy.y + Math.sin(angle) * enemy.radius * 0.6,
          per,
        );
      }
    } else {
      this.world.dropXp(enemy.x, enemy.y, value);
    }

    if (Math.random() < 0.02) {
      this.world.spawnPickup('heal', enemy.x, enemy.y, 8);
    }
  }
}
