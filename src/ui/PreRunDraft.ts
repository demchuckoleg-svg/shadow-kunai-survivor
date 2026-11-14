/**
 * Экран драфта: выбор 5 стартовых скиллов перед забегом.
 * Зависимости: data/skills, types, ui/dom.
 */

import type { SkillDefinition, SkillId } from '@/types/game';
import { SKILL_DEFINITIONS } from '@/data/skills';
import { SCREEN_CLASS, button, el } from './dom';

const SLOTS = 5;

export class PreRunDraft {
  readonly root: HTMLDivElement;
  private readonly selected = new Set<SkillId>();
  private readonly cards = new Map<SkillId, HTMLButtonElement>();
  private readonly counter = el('span', 'text-[#35e6ff] font-black', '0/5');
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

    const header = el('div', 'flex flex-col items-center gap-1 pb-3');
    header.append(
      el('div', 'text-[11px] tracking-[0.35em] text-[#8b93a7] font-bold', 'SHADOW KUNAI'),
      el('h1', 'text-2xl font-black tracking-wide text-center', 'Выбери 5 скиллов'),
      el(
        'div',
        'text-xs text-[#8b93a7] text-center',
        'Все способности кастуются автоматически. Комбинируй ветки для слияний.',
      ),
    );

    const grid = el('div', 'grid grid-cols-2 gap-2 overflow-y-auto flex-1 pb-3');
    for (const def of this.available) {
      const card = this.buildCard(def);
      this.cards.set(def.id, card);
      grid.appendChild(card);
    }

    const footer = el('div', 'flex flex-col gap-2');
    const status = el('div', 'flex items-center justify-between text-xs text-[#8b93a7] px-1');
    status.append(el('span', '', 'Выбрано'), this.counter);

    this.startButton = button(
      'w-full rounded-2xl py-4 font-black tracking-wider text-[#04141a] transition disabled:opacity-40',
      'В БОЙ',
    );
    this.startButton.style.background = 'linear-gradient(90deg,#35e6ff,#9be15d)';
    this.startButton.style.boxShadow = '0 0 28px rgba(53,230,255,0.35)';
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
    const card = button('relative flex flex-col gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.98]', '');
    card.style.background = 'rgba(255,255,255,0.035)';
    card.style.borderColor = 'rgba(255,255,255,0.08)';

    const dot = el('span', 'inline-block h-2 w-2 rounded-full');
    dot.style.background = `#${def.color.toString(16).padStart(6, '0')}`;
    dot.style.boxShadow = `0 0 10px #${def.color.toString(16).padStart(6, '0')}`;

    const titleRow = el('div', 'flex items-center gap-2');
    titleRow.append(dot, el('span', 'text-sm font-bold leading-tight', def.name));

    card.append(
      titleRow,
      el('span', 'text-[11px] leading-snug text-[#9aa3b8]', def.description),
      el('span', 'text-[10px] font-bold tracking-wider text-[#6f7890] uppercase', def.behavior),
    );

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
      card.style.borderColor = on ? 'rgba(53,230,255,0.85)' : 'rgba(255,255,255,0.08)';
      card.style.background = on ? 'rgba(53,230,255,0.12)' : 'rgba(255,255,255,0.035)';
      card.style.boxShadow = on ? '0 0 20px rgba(53,230,255,0.22)' : 'none';
      card.style.opacity = on ? '1' : '0.72';
    }
  }
}
