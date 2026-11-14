/**
 * Оркестратор экранов: драфт -> бой (HUD) -> левел-ап -> game over.
 * Зависимости: GameState, ui/*.
 */

import type { GameState } from '@/core/GameState';
import type { RunStats, SkillId, UpgradeCard } from '@/types/game';
import { HudOverlay } from './HudOverlay';
import { GameOverModal } from './GameOverModal';
import { LevelUpModal } from './LevelUpModal';
import { PreRunDraft } from './PreRunDraft';
import { PauseMenu, type PauseActions } from './PauseMenu';

export interface UICallbacks {
  onStart: (loadout: SkillId[]) => void;
  onRestart: () => void;
  onUltimate: () => void;
  onAutoUlt: (enabled: boolean) => void;
  onPause: () => void;
}

export class UIManager {
  readonly hud: HudOverlay;
  private readonly container: HTMLElement;
  private overlay: HTMLElement | null = null;

  constructor(container: HTMLElement, private readonly callbacks: UICallbacks) {
    this.container = container;
    this.hud = new HudOverlay(callbacks.onUltimate, callbacks.onAutoUlt, callbacks.onPause);
    this.container.appendChild(this.hud.root);
  }

  showDraft(): void {
    this.clearOverlay();
    this.hud.hide();
    const draft = new PreRunDraft((loadout) => {
      this.clearOverlay();
      this.callbacks.onStart(loadout);
    });
    this.mount(draft.root);
  }

  showHud(): void {
    this.hud.show();
  }

  showLevelUp(level: number, cards: readonly UpgradeCard[], onPick: (card: UpgradeCard) => void): void {
    this.clearOverlay();
    const modal = new LevelUpModal(level, cards, (card) => {
      this.clearOverlay();
      onPick(card);
    });
    this.mount(modal.root);
  }

  showPause(state: GameState, actions: PauseActions): void {
    this.clearOverlay();
    const menu = new PauseMenu(state, actions);
    this.mount(menu.root);
  }

  hidePause(): void {
    this.clearOverlay();
  }

  showGameOver(stats: RunStats): void {
    this.clearOverlay();
    this.hud.hide();
    const modal = new GameOverModal(stats, this.callbacks.onRestart);
    this.mount(modal.root);
  }

  updateHud(state: GameState, canUltimate: boolean, ultimateActive: boolean): void {
    this.hud.update(state, canUltimate, ultimateActive);
  }

  setAutoUlt(enabled: boolean): void {
    this.hud.setAuto(enabled);
  }

  private mount(node: HTMLElement): void {
    this.overlay = node;
    this.container.appendChild(node);
  }

  private clearOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
