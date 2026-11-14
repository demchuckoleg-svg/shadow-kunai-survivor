/** Global input bindings: keyboard, tactile UI feedback, visibility and Android back. */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { SoundEngine } from '@/audio/SoundEngine';

export interface GameKeyHandlers {
  ultimate: () => void;
  pauseToggle: () => void;
  unlockUltimate: () => void;
  levelSlot: (index: number) => void;
}

const CODE_TO_SLOT = /^Digit([1-5])$/;

export function exitApp(): void {
  void App.exitApp();
}

export function bindKeyboard(handlers: GameKeyHandlers): void {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select')) return;

    if (event.code === 'Escape') {
      event.preventDefault();
      handlers.pauseToggle();
      return;
    }
    if (event.code === 'KeyQ' || event.code === 'Space') {
      event.preventDefault();
      handlers.ultimate();
      return;
    }
    if (event.code === 'KeyU') {
      handlers.unlockUltimate();
      return;
    }
    const slot = CODE_TO_SLOT.exec(event.code);
    if (slot?.[1]) handlers.levelSlot(Number(slot[1]) - 1);
  });
}

/** Crimson flash + 12 ms vibration + synthesized click on every button. */
export function bindTactileButtons(sound: SoundEngine): void {
  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('button');
      if (!node) return;
      navigator.vibrate?.(12);
      sound.playUiClick();
      node.classList.add('ui-flash');
      window.setTimeout(() => node.classList.remove('ui-flash'), 60);
    },
    { passive: true },
  );
}

export function bindVisibilityPause(onHidden: () => void): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onHidden();
  });
}

export function bindAndroidBack(onBack: () => void): void {
  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', onBack);
  }
}
