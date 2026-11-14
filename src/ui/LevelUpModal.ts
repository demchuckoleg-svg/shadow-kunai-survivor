/**
 * Level-up draft modal: stat / augmentation / golden synergy card.
 * Neo-Edo ink styling with bespoke skill icons.
 */

import type { Rarity, SkillId, UpgradeCard } from '@/types/game';
import { getSynergyRecipe } from '@/data/synergies';
import { PALETTE } from '@/assets/palette';
import { skillIcon, uiIcon } from '@/assets/SvgIcons';
import { SCREEN_CLASS, button, el } from './dom';

const RARITY_COLOR: Record<Rarity, string> = {
  common: PALETTE.ash,
  rare: PALETTE.jade,
  epic: PALETTE.gold,
  legendary: PALETTE.goldLight,
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
      el('div', 'font-mono text-[9px] tracking-[0.4em] text-ash', 'НОВЫЙ УРОВЕНЬ'),
      el('div', 'font-display text-4xl font-bold text-gold', String(level)),
      el('div', 'text-[11px] text-ash', 'Выбери одно усиление'),
    );

    const list = el('div', 'neo-scroll flex w-full max-w-[430px] flex-col gap-2.5 overflow-y-auto');

    for (const card of cards) {
      const accent = RARITY_COLOR[card.rarity];
      const node = button(
        'neo-panel chamfer relative flex w-full items-stretch gap-3 p-3 text-left',
        '',
      );
      if (card.kind === 'synergy') node.classList.add('neo-panel--gold');
      node.style.background =
        card.kind === 'synergy' ? 'rgba(212,175,55,0.10)' : PALETTE.slate;
      node.style.borderColor = accent;

      const rail = el('span', 'absolute left-0 top-0 h-full w-[3px]');
      rail.style.background = accent;

      const iconBox = el('span', 'relative grid h-12 w-12 shrink-0 place-items-center');
      iconBox.innerHTML = card.skillId
        ? skillIcon(card.skillId, 48)
        : this.synergyIcon(card, 48);

      const body = el('div', 'flex min-w-0 flex-1 flex-col gap-1');
      const top = el('div', 'flex items-center justify-between gap-2');
      const kind = el('span', 'font-mono text-[8px] tracking-[0.24em]', KIND_LABEL[card.kind]);
      kind.style.color = accent;
      top.append(kind);
      if (card.nextLevel !== null) {
        top.append(el('span', 'font-mono text-[9px] text-ash', `УР. ${card.nextLevel}/10`));
      }

      body.append(
        top,
        el('div', 'font-display text-[15px] font-bold leading-tight text-bone', card.title),
        el('div', 'text-[10px] leading-snug text-ash', card.description),
      );

      node.append(rail, iconBox, body);
      node.addEventListener('click', () => onPick(card));
      list.appendChild(node);
    }

    this.root.append(header, list);
  }

  private synergyIcon(card: UpgradeCard, size: number): string {
    const recipe = card.synergyId ? getSynergyRecipe(card.synergyId) : undefined;
    const first: SkillId | undefined = recipe?.ingredients[0];
    if (first) return skillIcon(first, size);
    return uiIcon('ult', size);
  }
}
