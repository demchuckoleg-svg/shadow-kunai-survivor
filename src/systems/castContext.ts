/** Общий контекст и хелперы для продвинутых кастов скиллов. */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { CombatSystem } from '@/systems/CombatSystem';
import type { EnemyEntity } from '@/types/game';

export interface CastContext {
  state: GameState;
  world: World;
  combat: CombatSystem;
}

export function nearestEnemy(ctx: CastContext, maxDistance: number): EnemyEntity | null {
  const player = ctx.state.player;
  return ctx.world.enemyGrid.nearest(player.x, player.y, maxDistance);
}

export function enemiesInCircle(
  ctx: CastContext,
  x: number,
  y: number,
  radius: number,
): EnemyEntity[] {
  return ctx.world.enemyGrid.queryCircle(x, y, radius, []);
}

export function clampArena(value: number): number {
  return Math.max(-3300, Math.min(3300, value));
}
