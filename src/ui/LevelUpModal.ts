/**
 * Модалка выбора 1 из 3 карточек при повышении уровня.
 * Зависимости: types, ui/dom.
 */

import type { Rarity, UpgradeCard } from '@/types/game';
import { SCREEN_CLASS, button, el } from './dom';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b93a7',
  rare: '#35e6ff',
  epic: '#c084fc',
  legendary: '#ffc94a',
};

const KIND_LABEL: Record<UpgradeCard['kind'], string> = {
  stat: 'УЛУЧШЕНИЕ',
  augment: 'АУГМЕНТАЦИЯ',
  synergy: 'СЛИЯНИЕ',
};

export class LevelUpModal {
  readonly root: HTMLDivElement;

  constructor(level: number, cards: readonly UpgradeCard[], onPick: (card: UpgradeCard) => void) {
    this.root = el('div', `${SCREEN_CLASS} items-center justify-center gap-4 px-4`);
    this.root.dataset.ui = 'levelup';

    const header = el('div', 'flex flex-col items-center gap-1 text-center');
    header.append(
      el('div', 'text-[11px] tracking-[0.35em] text-[#8b93a7] font-bold', 'НОВЫЙ УРОВЕНЬ'),
      el('div', 'text-4xl font-black text-[#35e6ff] drop-shadow-[0_0_24px_rgba(53,230,255,0.5)]', String(level)),
      el('div', 'text-xs text-[#9aa3b8]', 'Выбери одно усиление'),
    );

    const list = el('div', 'flex w-full max-w-[420px] flex-col gap-2.5');

    for (const card of cards) {
      const color = RARITY_COLOR[card.rarity];
      const node = button(
        'relative flex flex-col gap-1 rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.98]',
        '',
      );
      node.style.borderColor = color;
      node.style.background =
        card.kind === 'synergy'
          ? 'linear-gradient(135deg, rgba(255,201,74,0.18), rgba(255,46,77,0.10))'
          : 'rgba(255,255,255,0.045)';
      node.style.boxShadow = `0 0 22px ${color}33`;

      const top = el('div', 'flex items-center justify-between gap-2');
      const kind = el('span', 'text-[9px] font-black tracking-[0.2em]', KIND_LABEL[card.kind]);
      kind.style.color = color;
      top.append(kind);
      if (card.nextLevel !== null) {
        top.append(el('span', 'text-[10px] font-bold text-[#9aa3b8]', `ур. ${card.nextLevel} / 10`));
      }

      node.append(
        top,
        el('div', 'text-base font-black leading-tight', card.title),
        el('div', 'text-xs leading-snug text-[#aeb7c9]', card.description),
      );
      node.addEventListener('click', () => onPick(card));
      list.appendChild(node);
    }

    this.root.append(header, list);
  }
}
