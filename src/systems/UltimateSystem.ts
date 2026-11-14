/**
 * «Оги: Небесный Вихрь Теней» — ульта 50 уровня (Wanwan + Hayabusa).
 * Фазы: ASCEND -> BARRAGE -> DESCEND. Цепное продление при смерти метки.
 * Зависимости: GameState, World, CombatSystem, PlayerSystem, Camera, data/ultimate.
 */

import type { GameState } from '@/core/GameState';
import type { World } from '@/core/World';
import type { Camera } from '@/core/Camera';
import type { EnemyEntity } from '@/types/game';
import { ULTIMATE_CONFIG } from '@/data/ultimate';
import type { CombatSystem } from './CombatSystem';

const KUNAI_DAMAGE = 14;
const SLASH_DAMAGE = 26;
const SLASH_RADIUS = 90;
const MARK_INTERVAL = 0.12;

export interface ScreenSize {
  width: number;
  height: number;
}

export class UltimateSystem {
  private markTimer = 0;
  private readonly targetBuffer: EnemyEntity[] = [];
  private readonly slashBuffer: EnemyEntity[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly state: GameState,
    private readonly world: World,
    private readonly combat: CombatSystem,
    private readonly camera: Camera,
    private readonly screen: () => ScreenSize,
  ) {
    this.unsubscribe = combat.onKill((enemy) => this.onEnemyKilled(enemy));
  }

  get isActive(): boolean {
    return this.state.ultimate.active;
  }

  canActivate(): boolean {
    const state = this.state;
    return (
      state.isRunning &&
      state.player.alive &&
      state.player.ultUnlocked &&
      state.player.ultCharge >= 100 &&
      state.ultimate.phase === 'IDLE'
    );
  }

  tryActivate(): boolean {
    if (!this.canActivate()) return false;
    const ult = this.state.ultimate;
    ult.active = true;
    ult.phase = 'ASCEND';
    ult.timer = ULTIMATE_CONFIG.ascendDuration;
    ult.barrageTimer = 0;
    ult.bonusTimeUsed = 0;
    ult.primaryTargetId = -1;
    ult.kunaiTimer = 0;
    ult.slashTimer = 0;
    this.markTimer = 0;
    this.state.player.ultCharge = 0;
    this.camera.setZoom(ULTIMATE_CONFIG.cameraZoom);
    this.world.spawnVfx({
      kind: 'shockwave',
      x: this.state.player.x,
      y: this.state.player.y,
      color: 0xff2e4d,
      life: 0.5,
      radius: 80,
      width: 5,
    });
    this.state.emit('ultimateActivated');
    return true;
  }

  update(dt: number): void {
    const ult = this.state.ultimate;
    if (!ult.active) return;

    ult.timer -= dt;
    switch (ult.phase) {
      case 'ASCEND':
        if (ult.timer <= 0) this.beginBarrage();
        break;
      case 'BARRAGE':
        this.updateBarrage(dt);
        break;
      case 'DESCEND':
        if (ult.timer <= 0) this.finish();
        break;
      case 'IDLE':
      default:
        break;
    }
  }

  private beginBarrage(): void {
    const ult = this.state.ultimate;
    ult.phase = 'BARRAGE';
    ult.barrageTimer = ULTIMATE_CONFIG.barrageDuration;
    ult.timer = ult.barrageTimer;
    ult.kunaiTimer = 0;
    ult.slashTimer = 0;
    ult.primaryTargetId = this.findPrimaryTarget()?.id ?? -1;
  }

  private updateBarrage(dt: number): void {
    const ult = this.state.ultimate;
    ult.barrageTimer -= dt;
    ult.timer = ult.barrageTimer;

    let target = this.world.getEnemyById(ult.primaryTargetId);
    if (!target || !target.active) {
      target = this.findPrimaryTarget();
      ult.primaryTargetId = target ? target.id : -1;
    }

    if (target) {
      this.updateMark(dt, target);
      ult.kunaiTimer -= dt;
      while (ult.kunaiTimer <= 0 && ult.barrageTimer > 0) {
        this.fireKunai(target);
        ult.kunaiTimer += ULTIMATE_CONFIG.kunaiInterval;
      }
      ult.slashTimer -= dt;
      while (ult.slashTimer <= 0 && ult.barrageTimer > 0) {
        this.performSlash();
        ult.slashTimer += ULTIMATE_CONFIG.slashInterval;
      }
    }

    if (ult.barrageTimer <= 0) {
      ult.phase = 'DESCEND';
      ult.timer = ULTIMATE_CONFIG.descendDuration;
      this.landing();
    }
  }

  private updateMark(dt: number, target: EnemyEntity): void {
    this.markTimer -= dt;
    if (this.markTimer > 0) return;
    this.markTimer = MARK_INTERVAL;
    this.world.spawnVfx({
      kind: 'mark',
      x: target.x,
      y: target.y - target.radius - 14,
      color: 0xff2e4d,
      life: 0.16,
      radius: 14,
      width: 2,
    });
  }

  private fireKunai(target: EnemyEntity): void {
    const spread = (Math.random() * 2 - 1) * 70;
    const startX = target.x + spread;
    const startY = target.y - 420;
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const speed = 940;
    this.world.spawnProjectile({
      kind: 'phantomKunai',
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: KUNAI_DAMAGE,
      sourceSkill: null,
      homing: true,
      targetId: target.id,
      lifetime: 1.6,
      color: 0xff4d6d,
      radius: 7,
      critChance: this.state.player.critChance + 0.15,
      critMult: this.state.player.critMult,
      pierce: 1,
    });
  }

  private performSlash(): void {
    const candidate = this.randomEnemyInView();
    if (!candidate) return;

    const angle = Math.random() * Math.PI * 2;
    const length = 520;
    const fromX = candidate.x - Math.cos(angle) * length;
    const fromY = candidate.y - Math.sin(angle) * length;

    this.world.spawnVfx({
      kind: 'slash',
      x: candidate.x,
      y: candidate.y,
      fromX,
      fromY,
      toX: candidate.x + Math.cos(angle) * length * 0.2,
      toY: candidate.y + Math.sin(angle) * length * 0.2,
      color: 0xff2e4d,
      life: 0.22,
      width: 5,
    });

    const victims = this.world.enemyGrid.queryCircle(
      candidate.x,
      candidate.y,
      SLASH_RADIUS,
      this.slashBuffer,
    );
    for (let i = 0; i < victims.length; i += 1) {
      const enemy = victims[i];
      if (!enemy || !enemy.active) continue;
      this.combat.damageEnemy(enemy, SLASH_DAMAGE, {
        sourceSkill: null,
        color: 0xff4d6d,
        critChance: this.state.player.critChance + 0.25,
        critMult: this.state.player.critMult,
        knockback: 12,
      });
    }
    this.camera.shake(3, 0.1);
  }

  private randomEnemyInView(): EnemyEntity | null {
    const { width, height } = this.screen();
    const radius = (Math.hypot(width, height) / 2) / Math.max(0.5, this.camera.zoom);
    const enemies = this.world.enemyGrid.queryCircle(
      this.state.player.x,
      this.state.player.y,
      radius,
      this.slashBuffer,
    );
    if (enemies.length === 0) return null;
    return enemies[Math.floor(Math.random() * enemies.length)] ?? null;
  }

  private findPrimaryTarget(): EnemyEntity | null {
    const { width, height } = this.screen();
    const radius = (Math.hypot(width, height) / 2) / Math.max(0.5, this.camera.zoom);
    const enemies = this.world.enemyGrid.queryCircle(
      this.state.player.x,
      this.state.player.y,
      radius,
      this.targetBuffer,
    );
    let best: EnemyEntity | null = null;
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      if (!enemy || !enemy.active || enemy.hp <= 0) continue;
      if (!best || enemy.hp > best.hp) best = enemy;
    }
    return best;
  }

  private onEnemyKilled(enemy: EnemyEntity): void {
    const ult = this.state.ultimate;
    if (!ult.active || ult.phase !== 'BARRAGE') return;
    if (enemy.id !== ult.primaryTargetId) return;

    if (ult.bonusTimeUsed < ULTIMATE_CONFIG.maxBonusTime - 1e-6) {
      ult.bonusTimeUsed = Math.min(ULTIMATE_CONFIG.maxBonusTime, ult.bonusTimeUsed + ULTIMATE_CONFIG.bonusPerMarkedKill);
      ult.barrageTimer += ULTIMATE_CONFIG.bonusPerMarkedKill;
      ult.timer = ult.barrageTimer;
    }

    const next = this.findPrimaryTarget();
    ult.primaryTargetId = next ? next.id : -1;
    this.world.spawnVfx({
      kind: 'ring',
      x: enemy.x,
      y: enemy.y,
      color: 0xff2e4d,
      life: 0.3,
      radius: 34,
      width: 2,
    });
  }

  private landing(): void {
    const player = this.state.player;
    this.camera.setZoom(1);
    this.camera.shake(16, 0.55);
    this.state.emit('ultimateLanded');

    this.world.spawnVfx({
      kind: 'shockwave',
      x: player.x,
      y: player.y,
      color: 0xff2e4d,
      life: 0.55,
      radius: ULTIMATE_CONFIG.landingRadius,
      width: 8,
    });
    this.world.spawnVfx({
      kind: 'shockwave',
      x: player.x,
      y: player.y,
      color: 0xffc94a,
      life: 0.75,
      radius: ULTIMATE_CONFIG.landingRadius * 0.7,
      width: 4,
    });

    const enemies = this.world.enemyGrid.queryCircle(
      player.x,
      player.y,
      ULTIMATE_CONFIG.landingRadius,
      this.targetBuffer,
    );
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      if (!enemy || !enemy.active) continue;
      this.combat.damageEnemy(enemy, ULTIMATE_CONFIG.landingDamage, {
        sourceSkill: null,
        color: 0xffc94a,
        knockback: 150,
        critChance: 0.5,
      });
      if (enemy.active) enemy.stunTimer = Math.max(enemy.stunTimer, ULTIMATE_CONFIG.stunDuration);
    }
  }

  private finish(): void {
    const ult = this.state.ultimate;
    ult.active = false;
    ult.phase = 'IDLE';
    ult.timer = 0;
    ult.barrageTimer = 0;
    ult.primaryTargetId = -1;
    this.camera.setZoom(1);
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
