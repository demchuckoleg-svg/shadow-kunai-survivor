/**
 * Продвинутые касты, часть A: Кусаригама, Молния, Сенбон, Огненный Шар,
 * Теневой Двойник, Макибиси, Ледяной Веер, Вороны.
 */

import type { SkillDefinition, SkillInstance } from '@/types/game';
import { computeSkillStats, hasAugment } from '@/data/skills';
import { clampArena, enemiesInCircle, nearestEnemy, type CastContext } from './castContext';

function inArc(angle: number, center: number, half: number): boolean {
  let diff = angle - center;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= half;
}

export function castKusarigama(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 560);
  const aim = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(player.facingY, player.facingX);
  const targets = enemiesInCircle(ctx, player.x, player.y, stats.radius);
  const pull = hasAugment(skill, 7);
  const stun = hasAugment(skill, 3);

  for (const enemy of targets) {
    if (!enemy.active || enemy.hp <= 0) continue;
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    if (!inArc(angle, aim, 1.15)) continue;
    ctx.combat.damageEnemy(enemy, stats.damage, {
      sourceSkill: skill.id,
      color: def.color,
      knockback: 18,
    });
    if (!enemy.active) continue;
    if (stun) enemy.stunTimer = Math.max(enemy.stunTimer, 0.6);
    if (pull) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const len = Math.hypot(dx, dy) || 1;
      enemy.x += (dx / len) * Math.min(70, len * 0.5);
      enemy.y += (dy / len) * Math.min(70, len * 0.5);
    }
  }

  ctx.world.spawnVfx({
    kind: 'slash',
    x: player.x,
    y: player.y,
    fromX: player.x + Math.cos(aim - 1.1) * 40,
    fromY: player.y + Math.sin(aim - 1.1) * 40,
    toX: player.x + Math.cos(aim + 1.1) * stats.radius,
    toY: player.y + Math.sin(aim + 1.1) * stats.radius,
    color: def.color,
    life: 0.25,
    width: 6,
  });

  if (hasAugment(skill, 10)) {
    let count = 0;
    ctx.world.orbitals.forEachActive((orbital) => {
      if (orbital.skillId === skill.id) count += 1;
    });
    for (let i = count; i < 2; i += 1) {
      ctx.world.spawnOrbital({
        skillId: skill.id,
        angle: (i / 2) * Math.PI * 2,
        orbitRadius: 150,
        angularSpeed: 4.2,
        damage: stats.damage * 0.5,
        radius: 17,
        color: def.color,
        knockback: 34,
      });
    }
  }
  return true;
}

export function castLightning(
  ctx: CastContext,
  skill: SkillInstance,
  def: SkillDefinition,
  castNumber: number,
): boolean {
  const target = nearestEnemy(ctx, 760);
  if (!target) return false;
  const stats = computeSkillStats(skill);
  const jumps = Math.max(1, stats.projectiles) + (hasAugment(skill, 3) ? 3 : 0);
  const visited = new Set<number>();
  let current: { x: number; y: number; id: number } | null = target;
  let fromX = ctx.state.player.x;
  let fromY = ctx.state.player.y;
  let damage = stats.damage;

  for (let i = 0; i < jumps && current; i += 1) {
    visited.add(current.id);
    ctx.world.spawnVfx({
      kind: 'slash',
      x: fromX,
      y: fromY,
      fromX,
      fromY,
      toX: current.x,
      toY: current.y,
      color: def.color,
      life: 0.18,
      width: 3,
    });
    const enemy = ctx.world.getEnemyById(current.id);
    if (enemy && enemy.active && enemy.hp > 0) {
      ctx.combat.damageEnemy(enemy, damage, {
        sourceSkill: skill.id,
        color: def.color,
        critChance: ctx.state.player.critChance + 0.1,
      });
      if (hasAugment(skill, 10) && enemy.active) ctx.combat.applyBurn(enemy, 2);
    }
    fromX = current.x;
    fromY = current.y;
    damage *= 0.82;

    const nearby = enemiesInCircle(ctx, fromX, fromY, 240).filter(
      (enemy) => enemy.active && enemy.hp > 0 && !visited.has(enemy.id),
    );
    nearby.sort(
      (a, b) =>
        (a.x - fromX) ** 2 + (a.y - fromY) ** 2 - ((b.x - fromX) ** 2 + (b.y - fromY) ** 2),
    );
    current = nearby[0] ?? null;
  }

  if (hasAugment(skill, 7) && castNumber % 4 === 0) {
    const area = enemiesInCircle(ctx, target.x, target.y, 110);
    for (const enemy of area) {
      if (!enemy.active || enemy.hp <= 0) continue;
      ctx.combat.damageEnemy(enemy, stats.damage * 1.2, {
        sourceSkill: skill.id,
        color: 0xffe08a,
        knockback: 30,
      });
    }
    ctx.world.spawnVfx({
      kind: 'shockwave',
      x: target.x,
      y: target.y,
      color: 0xffe08a,
      life: 0.4,
      radius: 110,
      width: 5,
    });
  }
  return true;
}

export function castSenbon(
  ctx: CastContext,
  skill: SkillInstance,
  def: SkillDefinition,
  castNumber: number,
): boolean {
  const target = nearestEnemy(ctx, 900);
  if (!target) return false;
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const aim = Math.atan2(target.y - player.y, target.x - player.x);
  const burst = hasAugment(skill, 7) && castNumber % 5 === 0;
  const count = burst ? 12 : Math.max(1, Math.min(8, stats.projectiles));
  const spread = burst ? 1.0 : 0.12;

  for (let i = 0; i < count; i += 1) {
    const angle = aim + (i - (count - 1) / 2) * spread * 0.2;
    ctx.world.spawnProjectile({
      kind: 'senbon',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      damage: stats.damage,
      sourceSkill: skill.id,
      pierce: 1,
      lifetime: 0.9,
      color: def.color,
      radius: 4,
      critChance: player.critChance + 0.05,
      knockback: 2,
    });
  }
  return true;
}

export function castFireball(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 850);
  const aim = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(player.facingY, player.facingX);
  const radius = 92 * (hasAugment(skill, 10) ? 1.35 : 1);

  ctx.world.spawnProjectile({
    kind: 'fireball',
    x: player.x,
    y: player.y,
    vx: Math.cos(aim) * stats.speed,
    vy: Math.sin(aim) * stats.speed,
    damage: stats.damage,
    sourceSkill: skill.id,
    lifetime: 2.3,
    color: def.color,
    radius: def.radius,
    explodeRadius: radius,
    explodeZone: hasAugment(skill, 3) ? 'lava' : null,
    explodeChildren: hasAugment(skill, 7) ? 4 : 0,
    critChance: player.critChance,
    critMult: player.critMult,
  });
  return true;
}

export function castShadowClone(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const player = ctx.state.player;
  const stats = computeSkillStats(skill);
  const count = 1 + (hasAugment(skill, 7) ? 1 : 0) + (hasAugment(skill, 10) ? 1 : 0);
  const targets = enemiesInCircle(ctx, player.x, player.y, 700).filter(
    (enemy) => enemy.active && enemy.hp > 0,
  );
  if (targets.length === 0) return false;

  for (let i = 0; i < count; i += 1) {
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) continue;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    ctx.world.spawnProjectile({
      kind: 'cloneShot',
      x: player.x + Math.cos(angle) * 18,
      y: player.y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      damage: stats.damage,
      sourceSkill: skill.id,
      homing: true,
      targetId: target.id,
      lifetime: 3.2,
      color: def.color,
      radius: 17,
      explodeRadius: 88,
      critChance: player.critChance,
      knockback: 26,
    });
    if (hasAugment(skill, 3)) {
      ctx.world.spawnProjectile({
        kind: 'kunai',
        x: player.x,
        y: player.y,
        vx: Math.cos(angle + 0.15) * 760,
        vy: Math.sin(angle + 0.15) * 760,
        damage: stats.damage * 0.35,
        sourceSkill: skill.id,
        lifetime: 1.1,
        color: 0x9b8cff,
        radius: 6,
      });
    }
  }
  return true;
}

export function castMakibishi(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const x = clampArena(player.x - player.facingX * 46);
  const y = clampArena(player.y - player.facingY * 46);
  const percentBonus = hasAugment(skill, 10) ? 4 + player.level * 0.4 : 0;

  ctx.world.spawnZone({
    kind: 'spikes',
    skillId: skill.id,
    x,
    y,
    radius: stats.radius,
    duration: hasAugment(skill, 7) ? 7 : 5,
    damage: stats.damage + percentBonus,
    color: def.color,
    tickInterval: 0.45,
    slowFactor: hasAugment(skill, 3) ? 0.5 : 1,
  });

  if (hasAugment(skill, 7)) {
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.world.spawnProjectile({
        kind: 'needle',
        x,
        y,
        vx: Math.cos(angle) * 420,
        vy: Math.sin(angle) * 420,
        damage: stats.damage * 0.6,
        sourceSkill: skill.id,
        pierce: 1,
        lifetime: 0.8,
        color: def.color,
        radius: 4,
        knockback: 3,
      });
    }
  }
  return true;
}

export function castIceFan(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 850);
  const aim = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(player.facingY, player.facingX);
  const full = hasAugment(skill, 10);
  const count = full ? 12 : Math.max(1, Math.min(10, stats.projectiles));

  for (let i = 0; i < count; i += 1) {
    const angle = full
      ? (i / count) * Math.PI * 2
      : aim + (i - (count - 1) / 2) * 0.19;
    ctx.world.spawnProjectile({
      kind: 'iceShard',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      damage: stats.damage * 0.7,
      sourceSkill: skill.id,
      pierce: 2,
      lifetime: 1.1,
      color: def.color,
      radius: 7,
      freezeDuration: 0.9,
      critChance: player.critChance,
      critMult: player.critMult,
    });
  }
  return true;
}

export function castCrows(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const target = nearestEnemy(ctx, 900);
  if (!target) return false;
  const player = ctx.state.player;
  const stats = computeSkillStats(skill);

  if (hasAugment(skill, 7)) {
    ctx.world.pickups.forEachActive((pickup) => {
      if (pickup.kind === 'xp') pickup.magnetized = true;
    });
  }

  if (hasAugment(skill, 10)) {
    ctx.world.spawnProjectile({
      kind: 'crow',
      x: player.x,
      y: player.y,
      vx: Math.cos(Math.atan2(target.y - player.y, target.x - player.x)) * 360,
      vy: Math.sin(Math.atan2(target.y - player.y, target.x - player.x)) * 360,
      damage: stats.damage * 3,
      sourceSkill: skill.id,
      homing: true,
      targetId: target.id,
      pierce: 99,
      lifetime: 8,
      color: 0x2a2a40,
      radius: 21,
      explodeRadius: 120,
      critChance: player.critChance,
      critMult: player.critMult,
    });
    return true;
  }

  const count = Math.max(1, Math.min(8, stats.projectiles + (hasAugment(skill, 3) ? 2 : 0)));
  for (let i = 0; i < count; i += 1) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x) + (i - count / 2) * 0.2;
    ctx.world.spawnProjectile({
      kind: 'crow',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * 390,
      vy: Math.sin(angle) * 390,
      damage: stats.damage,
      sourceSkill: skill.id,
      homing: true,
      targetId: target.id,
      pierce: 99,
      lifetime: 6,
      color: def.color,
      radius: 9,
      critChance: player.critChance,
      critMult: player.critMult,
    });
  }
  return true;
}
