/**
 * Продвинутые касты, часть B: Рывок Призрака, Фонарь, Бамбук, Маска Они,
 * Водяной Дракон, Зеркало Иллюзий, Печать Жнеца.
 */

import type { SkillDefinition, SkillInstance } from '@/types/game';
import { computeSkillStats, hasAugment } from '@/data/skills';
import { clampArena, enemiesInCircle, nearestEnemy, type CastContext } from './castContext';

export function castGhostDash(
  ctx: CastContext,
  skill: SkillInstance,
  def: SkillDefinition,
): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  let fromX = player.x;
  let fromY = player.y;

  if (hasAugment(skill, 10)) {
    const targets = enemiesInCircle(ctx, player.x, player.y, 640)
      .filter((enemy) => enemy.active && enemy.hp > 0)
      .sort(
        (a, b) =>
          (a.x - player.x) ** 2 + (a.y - player.y) ** 2 - ((b.x - player.x) ** 2 + (b.y - player.y) ** 2),
      )
      .slice(0, 5);
    if (targets.length === 0) return false;
    for (const enemy of targets) {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      player.x = clampArena(enemy.x - Math.cos(angle) * 26);
      player.y = clampArena(enemy.y - Math.sin(angle) * 26);
      ctx.world.spawnVfx({
        kind: 'slash',
        x: fromX,
        y: fromY,
        fromX,
        fromY,
        toX: enemy.x,
        toY: enemy.y,
        color: def.color,
        life: 0.22,
        width: 5,
      });
      ctx.combat.damageEnemy(enemy, stats.damage * 0.6, {
        sourceSkill: skill.id,
        color: def.color,
        critChance: ctx.state.player.critChance + 0.2,
        knockback: 14,
      });
      fromX = player.x;
      fromY = player.y;
    }
  } else {
    const target = nearestEnemy(ctx, 560);
    const aim = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : Math.atan2(player.facingY, player.facingX);
    const distance = stats.radius;
    player.x = clampArena(player.x + Math.cos(aim) * distance);
    player.y = clampArena(player.y + Math.sin(aim) * distance);

    const victims = enemiesInCircle(ctx, player.x, player.y, 110);
    for (const enemy of victims) {
      if (!enemy.active || enemy.hp <= 0) continue;
      ctx.combat.damageEnemy(enemy, stats.damage, {
        sourceSkill: skill.id,
        color: def.color,
        knockback: 24,
      });
    }
    ctx.world.spawnVfx({
      kind: 'slash',
      x: fromX,
      y: fromY,
      fromX,
      fromY,
      toX: player.x,
      toY: player.y,
      color: def.color,
      life: 0.26,
      width: 7,
    });
  }

  if (hasAugment(skill, 3)) {
    player.invulnTimer = Math.max(player.invulnTimer, 0.5);
    player.speedBoostTimer = Math.max(player.speedBoostTimer, 1);
  }

  if (hasAugment(skill, 7)) {
    for (let i = 0; i < 4; i += 1) {
      const t = (i + 1) / 5;
      ctx.world.spawnProjectile({
        kind: 'kunai',
        x: fromX + (player.x - fromX) * t,
        y: fromY + (player.y - fromY) * t,
        vx: 0,
        vy: 0,
        damage: stats.damage * 0.4,
        sourceSkill: skill.id,
        lifetime: 0.5 + i * 0.06,
        color: 0x7fe7ff,
        radius: 8,
        explodeRadius: 72,
      });
    }
  }

  ctx.world.spawnVfx({
    kind: 'ring',
    x: player.x,
    y: player.y,
    color: def.color,
    life: 0.3,
    radius: 44,
    width: 3,
  });
  return true;
}

export function castLantern(
  ctx: CastContext,
  skill: SkillInstance,
  def: SkillDefinition,
  castNumber: number,
): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 620);
  if (!target) return false;

  ctx.world.spawnProjectile({
    kind: 'soulFire',
    x: player.x,
    y: player.y,
    vx: Math.cos(Math.atan2(target.y - player.y, target.x - player.x)) * 480,
    vy: Math.sin(Math.atan2(target.y - player.y, target.x - player.x)) * 480,
    damage: stats.damage,
    sourceSkill: skill.id,
    homing: true,
    targetId: target.id,
    lifetime: 2,
    color: def.color,
    radius: 9,
    critChance: player.critChance,
    critMult: player.critMult,
  });

  if (hasAugment(skill, 7) && castNumber % 10 === 0) {
    const victims = enemiesInCircle(ctx, player.x, player.y, 560).filter(
      (enemy) => enemy.active && enemy.hp > 0,
    );
    for (let i = 0; i < 3 && victims.length > 0; i += 1) {
      const victim = victims[Math.floor(Math.random() * victims.length)];
      if (!victim) continue;
      ctx.world.spawnProjectile({
        kind: 'soulFire',
        x: player.x,
        y: player.y,
        vx: 0,
        vy: -320,
        damage: stats.damage * 0.8,
        sourceSkill: skill.id,
        homing: true,
        targetId: victim.id,
        lifetime: 2.4,
        color: 0xd9ff9b,
        radius: 8,
      });
    }
  }

  if (hasAugment(skill, 10)) {
    const aura = enemiesInCircle(ctx, player.x, player.y, stats.radius);
    for (const enemy of aura) {
      if (!enemy.active || enemy.hp <= 0) continue;
      ctx.combat.damageEnemy(enemy, stats.damage * 0.5, {
        sourceSkill: skill.id,
        color: def.color,
        showText: false,
      });
    }
    ctx.world.spawnVfx({
      kind: 'ring',
      x: player.x,
      y: player.y,
      color: def.color,
      life: 0.35,
      radius: stats.radius,
      width: 3,
    });
  }
  return true;
}

export function castBamboo(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const targets = enemiesInCircle(ctx, player.x, player.y, 580)
    .filter((enemy) => enemy.active && enemy.hp > 0)
    .slice(0, hasAugment(skill, 10) ? 12 : 3);
  if (targets.length === 0) return false;

  for (const enemy of targets) {
    ctx.combat.damageEnemy(enemy, stats.damage, {
      sourceSkill: skill.id,
      color: def.color,
      knockback: 8,
    });
    if (enemy.active && hasAugment(skill, 3)) enemy.stunTimer = Math.max(enemy.stunTimer, 0.5);
    ctx.world.spawnVfx({
      kind: 'slash',
      x: enemy.x,
      y: enemy.y,
      fromX: enemy.x,
      fromY: enemy.y + 26,
      toX: enemy.x,
      toY: enemy.y - 26,
      color: def.color,
      life: 0.25,
      width: 5,
    });
  }

  if (hasAugment(skill, 7)) {
    ctx.world.projectiles.forEachActive((projectile) => {
      if (projectile.faction !== 'enemy') return;
      const dx = projectile.x - player.x;
      const dy = projectile.y - player.y;
      if (dx * dx + dy * dy <= 240 * 240) ctx.world.projectiles.release(projectile);
    });
  }

  if (hasAugment(skill, 10)) {
    ctx.world.spawnVfx({
      kind: 'shockwave',
      x: player.x,
      y: player.y,
      color: def.color,
      life: 0.5,
      radius: 260,
      width: 4,
    });
  }
  return true;
}

export function castOniMask(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const targets = enemiesInCircle(ctx, player.x, player.y, stats.radius);

  for (const enemy of targets) {
    if (!enemy.active || enemy.hp <= 0) continue;
    ctx.combat.damageEnemy(enemy, stats.damage, {
      sourceSkill: skill.id,
      color: def.color,
      knockback: 95,
      critChance: player.critChance + 0.05,
    });
  }

  ctx.world.spawnVfx({
    kind: 'shockwave',
    x: player.x,
    y: player.y,
    color: def.color,
    life: 0.4,
    radius: stats.radius,
    width: 6,
  });
  ctx.world.spawnVfx({
    kind: 'ring',
    x: player.x,
    y: player.y,
    color: 0xffc94a,
    life: 0.3,
    radius: stats.radius * 0.7,
    width: 3,
  });

  if (hasAugment(skill, 7)) {
    const reflectRadius = stats.radius + 70;
    ctx.world.projectiles.forEachActive((projectile) => {
      if (projectile.faction !== 'enemy') return;
      const dx = projectile.x - player.x;
      const dy = projectile.y - player.y;
      if (dx * dx + dy * dy > reflectRadius * reflectRadius) return;
      const angle = Math.atan2(-dy, -dx);
      projectile.faction = 'player';
      projectile.vx = Math.cos(angle) * 520;
      projectile.vy = Math.sin(angle) * 520;
      projectile.color = 0xff2e4d;
      projectile.damage *= 1.5;
      projectile.lifetime = Math.max(projectile.lifetime, 1.5);
      projectile.sourceSkill = skill.id;
    });
  }
  return true;
}

export function castWaterDragon(
  ctx: CastContext,
  skill: SkillInstance,
  def: SkillDefinition,
): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 900);
  const aim = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(player.facingY, player.facingX);
  const count = hasAugment(skill, 10) ? 3 : 1;

  for (let i = 0; i < count; i += 1) {
    const angle = aim + (i - (count - 1) / 2) * 0.24;
    ctx.world.spawnProjectile({
      kind: 'waterDragon',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      damage: stats.damage,
      sourceSkill: skill.id,
      pierce: 99,
      lifetime: 2.4,
      color: def.color,
      radius: 20,
      scale: 1.1,
      knockback: 55,
      critChance: player.critChance,
      critMult: player.critMult,
    });
  }

  if (hasAugment(skill, 7)) {
    const backAngle = aim + Math.PI;
    ctx.world.spawnProjectile({
      kind: 'waterDragon',
      x: player.x + Math.cos(aim) * 420,
      y: player.y + Math.sin(aim) * 420,
      vx: Math.cos(backAngle) * stats.speed,
      vy: Math.sin(backAngle) * stats.speed,
      damage: stats.damage * 0.7,
      sourceSkill: skill.id,
      pierce: 99,
      lifetime: 2,
      color: 0x7fe7ff,
      radius: 17,
      scale: 1.0,
      knockback: 40,
    });
  }

  if (hasAugment(skill, 10)) {
    ctx.world.spawnZone({
      kind: 'vortex',
      skillId: skill.id,
      x: player.x + Math.cos(aim) * 300,
      y: player.y + Math.sin(aim) * 300,
      radius: 84,
      duration: 2.6,
      damage: stats.damage * 0.2,
      color: 0x35b8ff,
      tickInterval: 0.3,
    });
  }
  return true;
}

export function castMirror(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const stats = computeSkillStats(skill);
  const player = ctx.state.player;
  const target = nearestEnemy(ctx, 900);
  const aim = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(player.facingY, player.facingX);
  const big = hasAugment(skill, 7);
  const ring = hasAugment(skill, 10);
  const count = ring ? 8 : hasAugment(skill, 3) ? 2 : 1;
  const damage = stats.damage * (big ? 1.5 : 1);

  for (let i = 0; i < count; i += 1) {
    const angle = ring ? (i / count) * Math.PI * 2 : aim + (i === 0 ? 0 : 0.18);
    ctx.world.spawnProjectile({
      kind: 'kunai',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      damage,
      sourceSkill: skill.id,
      pierce: 2,
      lifetime: 1.1,
      color: def.color,
      radius: 9,
      scale: big ? 1.5 : 1,
      critChance: player.critChance,
      critMult: player.critMult,
    });
  }

  ctx.world.spawnVfx({
    kind: 'ring',
    x: player.x,
    y: player.y,
    color: def.color,
    life: 0.3,
    radius: 56,
    width: 3,
  });
  return true;
}

export function castReaper(ctx: CastContext, skill: SkillInstance, def: SkillDefinition): boolean {
  const player = ctx.state.player;
  const targets = enemiesInCircle(ctx, player.x, player.y, 580)
    .filter((enemy) => enemy.active && enemy.hp > 0)
    .slice(0, hasAugment(skill, 10) ? 10 : 3);
  if (targets.length === 0) return false;

  for (const enemy of targets) {
    enemy.marked = true;
    ctx.world.spawnVfx({
      kind: 'mark',
      x: enemy.x,
      y: enemy.y - enemy.radius - 10,
      color: def.color,
      life: 0.5,
      radius: 16,
      width: 2,
    });
  }
  return true;
}
