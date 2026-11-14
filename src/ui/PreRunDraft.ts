/**
 * Pre-run draft: pick 5 of 20 skills. Neo-Edo ink styling.
 * Dependencies: data/skills, assets/SvgIcons, ui/dom.
 */

import type { SkillDefinition, SkillId } from '@/types/game';
import { SKILL_DEFINITIONS } from '@/data/skills';
import { skillIcon } from '@/assets/SvgIcons';
import { PALETTE } from '@/assets/palette';
import { SCREEN_CLASS, button, el } from './dom';

const SLOTS = 5;
const BEHAVIOR_LABEL: Record<string, string> = {
  projectile: 'СНАРЯД',
  orbit: 'ОРБИТА',
  meleeArc: 'КЛИНОК',
  zone: 'ЗОНА',
  chain: 'ЦЕПЬ',
  summon: 'ПРИЗЫВ',
  aura: 'АУРА',
  dash: 'РЫВОК',
  portal: 'ПОРТАЛ',
  mark: 'МЕТКА',
};

export class PreRunDraft {
  readonly root: HTMLDivElement;
  private readonly selected = new Set<SkillId>();
  private readonly cards = new Map<SkillId, HTMLButtonElement>();
  private readonly counter = el('span', 'font-mono text-goldlight font-bold', '0/5');
  private readonly startButton: HTMLButtonElement;
  private readonly available: SkillDefinition[];
  private readonly required: number;

  constructor(onStart: (loadout: SkillId[]) => void) {
    this.available = Object.values(SKILL_DEFINITIONS).filter(
      (def): def is SkillDefinition => def !== undefined,
    );
    this.required = Math.min(SLOTS, this.available.length);

    this.root = el('div', `${SCREEN_CLASS} px-4`);
    this.root.style.paddingTop = 'max(calc(env(safe-area-inset-top,0px) + 14px), 30px)';
    this.root.style.paddingBottom = 'max(calc(env(safe-area-inset-bottom,0px) + 14px), 18px)';

    const header = el('div', 'flex flex-col items-center gap-1.5 pb-4');
    const eyebrow = el('div', 'font-mono text-[10px] tracking-[0.45em] text-ash', 'SHADOW KUNAI');
    const title = el('h1', 'font-display text-2xl font-bold tracking-wide text-bone text-center', 'Выбери пять клинков');
    const subtitle = el(
      'div',
      'max-w-[340px] text-center text-[11px] leading-snug text-ash',
      'Все способности кастуются автоматически. Собери пять школ и открой путь к слияниям.',
    );
    const rule = el('div', 'ink-rule mt-2 w-40');
    header.append(eyebrow, title, subtitle, rule);

    const grid = el('div', 'neo-scroll grid grid-cols-2 gap-2.5 overflow-y-auto flex-1 pb-3');
    for (const def of this.available) {
      const card = this.buildCard(def);
      this.cards.set(def.id, card);
      grid.appendChild(card);
    }

    const footer = el('div', 'flex flex-col gap-2');
    const status = el('div', 'flex items-center justify-between px-1 font-mono text-[10px] tracking-widest text-ash');
    status.append(el('span', '', 'ВЫБРАНО'), this.counter);

    this.startButton = button('neo-btn chamfer py-4 text-center font-display text-lg font-bold', 'В БОЙ');
    this.startButton.style.background = PALETTE.crimson;
    this.startButton.style.borderColor = PALETTE.gold;
    this.startButton.style.color = PALETTE.bone;
    this.startButton.style.boxShadow = 'inset 0 0 0 3px rgba(11,12,16,0.55)';
    this.startButton.addEventListener('click', () => {
      if (this.selected.size !== this.required) return;
      onStart([...this.selected]);
    });

    footer.append(status, this.startButton);
    this.root.append(header, grid, footer);

    if (this.available.length <= SLOTS) {
      for (const def of this.available) this.selected.add(def.id);
    } else {
      for (const def of this.available.slice(0, SLOTS)) this.selected.add(def.id);
    }
    this.refresh();
  }

  private buildCard(def: SkillDefinition): HTMLButtonElement {
    const card = button('neo-panel chamfer relative flex flex-col gap-1.5 p-2.5 text-left transition', '');
    card.style.background = PALETTE.slate;
    card.style.borderColor = 'rgba(141,153,174,0.35)';

    const top = el('div', 'flex items-start gap-2');
    const icon = el('span', 'shrink-0 leading-none');
    icon.innerHTML = skillIcon(def.id, 38);
    const name = el('span', 'font-display text-[13px] font-bold leading-tight text-bone', def.name);
    top.append(icon, name);

    const description = el('span', 'text-[10px] leading-snug text-ash', def.description);
    const meta = el(
      'span',
      'font-mono text-[8px] tracking-[0.2em] text-gold/80',
      BEHAVIOR_LABEL[def.behavior] ?? def.behavior.toUpperCase(),
    );
    const mark = el('span', 'absolute right-2 top-2 h-1.5 w-1.5 rotate-45 bg-gold');
    mark.style.display = 'none';

    card.append(top, description, meta, mark);
    card.dataset.mark = '0';

    card.addEventListener('click', () => {
      if (this.selected.has(def.id)) {
        this.selected.delete(def.id);
      } else {
        if (this.selected.size >= this.required) return;
        this.selected.add(def.id);
      }
      this.refresh();
    });
    return card;
  }

  private refresh(): void {
    this.counter.textContent = `${this.selected.size}/${this.required}`;
    this.startButton.disabled = this.selected.size !== this.required;
    for (const [id, card] of this.cards) {
      const on = this.selected.has(id);
      card.style.borderColor = on ? PALETTE.gold : 'rgba(141,153,174,0.35)';
      card.style.background = on ? 'rgba(212,175,55,0.08)' : PALETTE.slate;
      card.style.boxShadow = on ? 'inset 0 0 0 1px rgba(243,229,171,0.35)' : 'none';
      card.style.opacity = on ? '1' : '0.62';
      card.dataset.mark = on ? '1' : '0';
      const mark = card.querySelector('span.absolute');
      if (mark instanceof HTMLElement) mark.style.display = on ? 'block' : 'none';
    }
  }
}
