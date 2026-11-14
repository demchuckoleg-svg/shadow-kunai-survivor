/**
 * Движок скиллов: авто-каст, применение уровней и аугментаций 3/7/10.
 * Шаг 4: Кунаи, Сюрикены, Катана, Дым, Печати.
 * Зависимости: GameState, World, CombatSystem, data/skills.
 */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { CombatSystem } from '@/systems/CombatSystem';
import type { EnemyEntity, SkillDefinition, SkillId, SkillInstance } from '@/types/game';
import {
  computeSkillStats,
  getSkillDefinition,
  hasAugment,
  unlockAugment,
} from '@/data/skills';

const RETRY_COOLDOWN = 0.12;
const SMOKE_DURATION = 4;
const SEAL_TIMER = 1.2;

export class SkillSystem {
  private readonly castCounts = new Map<SkillId, number>();
  private readonly sealVictims: EnemyEntity[] = [];
  private readonly sealVictimIds: number[] = [];
  private readonly chainIds: number[] = [];
  private readonly katanaTargets: EnemyEntity[] = [];
  private readonly smokeTargets: EnemyEntity[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly combat: CombatSystem,
  ) {
    this.unsubscribe = combat.onKill((enemy) => this.onEnemyKilled(enemy));
  }

  update(dt: number): void {
    if (!this.state.isRunning) return;
    this.updateSeals(dt);
    for (const skill of this.state.skills) {
      if (skill.isEvolved) continue;
      const def = getSkillDefinition(skill.id);
      if (!def) continue;
      skill.cooldownTimer -= dt;
      if (skill.cooldownTimer > 0) continue;
      const cast = this.cast(skill, def);
      const stats = computeSkillStats(skill);
      const speedBuff = this.state.player.attackSpeedBuffTimer > 0 ? 0.5 : 1;
      skill.cooldownTimer = cast ? stats.cooldown * speedBuff : RETRY_COOLDOWN;
    }
  }

  /** Повышает уровень скилла и автоматически открывает аугментацию на 3/7/10. */
  levelUpSkill(id: SkillId): boolean {
    const skill = this.state.getSkill(id);
    if (!skill || skill.level >= 10) return false;
    skill.level += 1;
    if (skill.level === 3 || skill.level === 7 || skill.level === 10) {
      unlockAugment(skill, skill.level);
    }
    return true;
  }

  private cast(skill: SkillInstance, def: SkillDefinition): boolean {
    switch (def.behavior) {
      case 'projectile':
        return this.castKunai(skill, def);
      case 'orbit':
        return this.castOrbit(skill, def);
      case 'meleeArc':
        return this.castKatana(skill, def);
      case 'zone':
        return this.castSmoke(skill, def);
      case 'mark':
        return this.castSeals(skill, def);
      default:
        return false;
    }
  }

  private nearestEnemy(maxDistance: number): EnemyEntity | null {
    const player = this.state.player;
    return this.world.enemyGrid.nearest(player.x, player.y, maxDistance);
  }

  private castKunai(skill: SkillInstance, def: SkillDefinition): boolean {
    const target = this.nearestEnemy(900);
    if (!target) return false;
    const stats = computeSkillStats(skill);
    const aim = Math.atan2(target.y - this.state.player.y, target.x - this.state.player.x);

    const castNumber = (this.castCounts.get(skill.id) ?? 0) + 1;
    this.castCounts.set(skill.id, castNumber);
    const fan = hasAugment(skill, 7) && castNumber % 3 === 0;
    const count = fan ? 5 : Math.min(5, Math.max(1, stats.projectiles));
    const homing = hasAugment(skill, 10);
    const pierce = def.pierce + (hasAugment(skill, 3) ? 1 : 0);

    for (let i = 0; i < count; i += 1) {
      const spread = count > 1 ? (i - (count - 1) / 2) * (fan ? 0.17 : 0.1) : 0;
      const angle = aim + spread;
      this.world.spawnProjectile({
        kind: 'kunai',
        x: this.state.player.x,
        y: this.state.player.y,
        vx: Math.cos(angle) * stats.speed,
        vy: Math.sin(angle) * stats.speed,
        damage: stats.damage,
        sourceSkill: skill.id,
        pierce,
        ricochet: homing ? 4 : 0,
        homing,
        targetId: homing ? target.id : -1,
        lifetime: 1.2,
        color: def.color,
        radius: def.radius,
        critChance: this.state.player.critChance,
        critMult: this.state.player.critMult,
        knockback: 4,
      });
    }

    this.world.spawnVfx({
      kind: 'hitFlash',
      x: this.state.player.x,
      y: this.state.player.y,
      color: def.color,
      life: 0.14,
      radius: 20,
      width: 2,
    });
    return true;
  }

  private castOrbit(skill: SkillInstance, def: SkillDefinition): boolean {
    const stats = computeSkillStats(skill);
    const widePush = hasAugment(skill, 3);
    const launchOnCrit = hasAugment(skill, 7);
    const outer = hasAugment(skill, 10);
    const orbitRadius = 92 * (widePush ? 1.35 : 1);
    const speed = 3.1;
    const existing = this.world.orbitals;

    let innerCount = 0;
    let outerCount = 0;
    existing.forEachActive((orbital) => {
      if (orbital.skillId !== skill.id) return;
      if (orbital.orbitRadius > orbitRadius * 1.2) outerCount += 1;
      else innerCount += 1;
    });

    const desiredInner = Math.min(8, Math.max(1, stats.projectiles));
    for (let i = innerCount; i < desiredInner; i += 1) {
      this.world.spawnOrbital({
        skillId: skill.id,
        angle: (i / desiredInner) * Math.PI * 2,
        orbitRadius,
        angularSpeed: speed,
        damage: stats.damage,
        radius: 12,
        color: def.color,
        knockback: widePush ? 42 : 8,
        launchOnCrit,
      });
    }

    if (outer) {
      for (let i = outerCount; i < 3; i += 1) {
        this.world.spawnOrbital({
          skillId: skill.id,
          angle: (i / 3) * Math.PI * 2,
          orbitRadius: orbitRadius * 1.55,
          angularSpeed: -speed * 0.62,
          damage: stats.damage * 1.25,
          radius: 19,
          color: 0xffe1a3,
          knockback: 60,
          launchOnCrit,
        });
      }
    }

    existing.forEachActive((orbital) => {
      if (orbital.skillId !== skill.id) return;
      orbital.damage = orbital.radius > 15 ? stats.damage * 1.25 : stats.damage;
      orbital.launchOnCrit = launchOnCrit;
      orbital.knockback = orbital.radius > 15 ? 60 : widePush ? 42 : 8;
    });

    return true;
  }

  private castKatana(skill: SkillInstance, def: SkillDefinition): boolean {
    const stats = computeSkillStats(skill);
    const player = this.state.player;
    const target = this.nearestEnemy(560);
    const aim = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : Math.atan2(player.facingY, player.facingX);

    const backSlash = hasAugment(skill, 3);
    const triple = hasAugment(skill, 10);
    const hits = triple ? 3 : 1;
    const arcHalf = 0.95;
    const hitDamage = stats.damage * (triple ? 0.72 : 1);
    const targets = this.world.enemyGrid.queryCircle(player.x, player.y, stats.radius, this.katanaTargets);

    for (let hit = 0; hit < hits; hit += 1) {
      for (let i = 0; i < targets.length; i += 1) {
        const enemy = targets[i];
        if (!enemy || !enemy.active || enemy.hp <= 0) continue;
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        if (!this.inArc(angle, aim, arcHalf) && !(backSlash && this.inArc(angle, aim + Math.PI, arcHalf)))
          continue;
        const guaranteedCrit = triple && enemy.bleedTimer > 0;
        this.combat.damageEnemy(enemy, hitDamage, {
          sourceSkill: skill.id,
          color: def.color,
          critChance: guaranteedCrit ? 1 : this.state.player.critChance,
          knockback: 16,
        });
        if (hasAugment(skill, 3) && enemy.active) this.combat.applyBleed(enemy, 3.5);
      }
    }

    const strikeAngle = triple ? aim + 0.6 * hits : aim;
    this.spawnSlashVfx(player.x, player.y, aim, stats.radius, def.color, 5);
    if (backSlash) this.spawnSlashVfx(player.x, player.y, aim + Math.PI, stats.radius * 0.85, 0xff7a8f, 4);
    if (triple) {
      this.spawnSlashVfx(player.x, player.y, strikeAngle + Math.PI / 2, stats.radius, 0xffc94a, 4);
      this.spawnSlashVfx(player.x, player.y, strikeAngle - Math.PI / 2, stats.radius, 0xffc94a, 4);
    }

    if (hasAugment(skill, 7)) {
      this.world.spawnProjectile({
        kind: 'katanaWave',
        x: player.x,
        y: player.y,
        vx: Math.cos(aim) * stats.speed,
        vy: Math.sin(aim) * stats.speed,
        damage: stats.damage * 0.7,
        sourceSkill: skill.id,
        pierce: 4,
        lifetime: 1.3,
        color: def.color,
        radius: 20,
        critChance: this.state.player.critChance,
        critMult: this.state.player.critMult,
      });
    }

    return true;
  }

  private inArc(angle: number, center: number, half: number): boolean {
    let diff = angle - center;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= half;
  }

  private spawnSlashVfx(
    x: number,
    y: number,
    angle: number,
    radius: number,
    color: number,
    width: number,
  ): void {
    this.world.spawnVfx({
      kind: 'slash',
      x,
      y,
      fromX: x + Math.cos(angle - 0.55) * radius * 0.35,
      fromY: y + Math.sin(angle - 0.55) * radius * 0.35,
      toX: x + Math.cos(angle + 0.55) * radius,
      toY: y + Math.sin(angle + 0.55) * radius,
      color,
      life: 0.2,
      width,
    });
  }

  private castSmoke(skill: SkillInstance, def: SkillDefinition): boolean {
    const stats = computeSkillStats(skill);
    const player = this.state.player;
    const target = this.nearestEnemy(620);
    const x = target ? target.x : player.x + player.facingX * 180;
    const y = target ? target.y : player.y + player.facingY * 180;

    const slowAmp = hasAugment(skill, 3);
    const clones = hasAugment(skill, 10);
    this.world.spawnZone({
      kind: 'smoke',
      skillId: skill.id,
      x,
      y,
      radius: stats.radius,
      duration: SMOKE_DURATION,
      damage: stats.damage * (clones ? 1.8 : 1),
      color: def.color,
      tickInterval: 0.25,
      slowFactor: slowAmp ? 0.7 : 1,
      damageAmp: slowAmp ? 1.2 : 1,
    });
    this.world.spawnVfx({
      kind: 'ring',
      x,
      y,
      color: def.color,
      life: 0.45,
      radius: stats.radius,
      width: 3,
    });
    return true;
  }

  private castSeals(skill: SkillInstance, _def: SkillDefinition): boolean {
    const stats = computeSkillStats(skill);
    const maxTargets = hasAugment(skill, 10) ? 10 : Math.min(4, stats.projectiles);
    const candidates = this.world.enemyGrid.queryCircle(
      this.state.player.x,
      this.state.player.y,
      520,
      this.smokeTargets,
    );
    let applied = 0;
    for (let i = 0; i < candidates.length && applied < maxTargets; i += 1) {
      const enemy = candidates[i];
      if (!enemy || !enemy.active || enemy.hp <= 0) continue;
      this.applySeal(enemy, stats.damage, stats.radius);
      applied += 1;
    }
    return applied > 0;
  }

  private applySeal(enemy: EnemyEntity, damage: number, radius: number): void {
    enemy.sealTimer = SEAL_TIMER;
    enemy.sealDamage = damage;
    enemy.sealRadius = radius;
    this.world.spawnVfx({
      kind: 'hitFlash',
      x: enemy.x,
      y: enemy.y - enemy.radius,
      color: 0xffc94a,
      life: 0.25,
      radius: 16,
      width: 2,
    });
  }

  private updateSeals(dt: number): void {
    this.world.enemies.forEachActive((enemy) => {
      if (enemy.sealTimer <= 0) return;
      enemy.sealTimer -= dt;
      if (enemy.sealTimer <= 0) this.explodeSeal(enemy, 1);
    });
  }

  private explodeSeal(origin: EnemyEntity, radiusMultiplier: number): void {
    const originId = origin.id;
    const damage = origin.sealDamage;
    const radius = origin.sealRadius * radiusMultiplier;
    const x = origin.x;
    const y = origin.y;
    origin.sealTimer = 0;
    origin.sealDamage = 0;
    origin.sealRadius = 0;

    this.world.spawnVfx({
      kind: 'explosion',
      x,
      y,
      color: 0xffc94a,
      life: 0.4,
      radius,
      width: 6,
    });
    this.world.spawnVfx({
      kind: 'ring',
      x,
      y,
      color: 0xff7a1a,
      life: 0.3,
      radius,
      width: 4,
    });

    const victims = this.world.enemyGrid.queryCircle(x, y, radius, this.sealVictims);
    this.sealVictimIds.length = 0;
    for (let i = 0; i < victims.length; i += 1) {
      const enemy = victims[i];
      if (enemy && enemy.active) this.sealVictimIds.push(enemy.id);
    }
    for (let i = 0; i < this.sealVictimIds.length; i += 1) {
      const id = this.sealVictimIds[i];
      if (id === undefined) continue;
      const enemy = this.world.getEnemyById(id);
      if (!enemy || !enemy.active || enemy.hp <= 0) continue;
      this.combat.damageEnemy(enemy, damage, {
        sourceSkill: 'seals',
        color: 0xffc94a,
        knockback: 18,
      });
      if (hasAugmentFor(this.state, 'seals', 3) && enemy.active) {
        this.combat.applyBurn(enemy, 2.5);
      }
    }

    if (hasAugmentFor(this.state, 'seals', 10)) {
      const nearby = this.world.enemyGrid.queryCircle(x, y, radius * 2.4, this.sealVictims);
      this.chainIds.length = 0;
      for (let i = 0; i < nearby.length && this.chainIds.length < 3; i += 1) {
        const enemy = nearby[i];
        if (!enemy || !enemy.active || enemy.hp <= 0 || enemy.sealTimer > 0) continue;
        if (enemy.id === originId) continue;
        this.chainIds.push(enemy.id);
      }
      for (let i = 0; i < this.chainIds.length; i += 1) {
        const id = this.chainIds[i];
        if (id === undefined) continue;
        const enemy = this.world.getEnemyById(id);
        if (!enemy || !enemy.active) continue;
        enemy.sealTimer = 0.8;
        enemy.sealDamage = damage * 0.6;
        enemy.sealRadius = radius * 0.8;
      }
    }
  }

  private onEnemyKilled(enemy: EnemyEntity): void {
    if (hasAugmentFor(this.state, 'seals', 7) && enemy.sealTimer > 0) {
      this.explodeSeal(enemy, 2);
    }
    if (!hasAugmentFor(this.state, 'smoke', 7)) return;

    const smokeSkill = this.state.getSkill('smoke');
    if (!smokeSkill) return;
    this.world.zones.forEachActive((zone) => {
      if (zone.kind !== 'smoke' || zone.skillId !== 'smoke') return;
      const dx = enemy.x - zone.x;
      const dy = enemy.y - zone.y;
      if (dx * dx + dy * dy > zone.radius * zone.radius) return;
      this.world.spawnZone({
        kind: 'smoke',
        skillId: 'smoke',
        x: enemy.x,
        y: enemy.y,
        radius: zone.radius * 0.8,
        duration: 2.5,
        damage: zone.damage,
        color: zone.color,
        tickInterval: zone.tickInterval,
        slowFactor: zone.slowFactor,
        damageAmp: zone.damageAmp,
      });
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}

function hasAugmentFor(state: GameState, id: SkillId, level: 3 | 7 | 10): boolean {
  const skill = state.getSkill(id);
  return skill ? hasAugment(skill, level) : false;
}
