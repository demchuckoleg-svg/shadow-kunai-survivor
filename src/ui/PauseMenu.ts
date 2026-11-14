/**
 * Pause overlay: resume, exit, and a per-skill upgrade ledger.
 * Neo-Edo ink styling; no rounded corners, no external icons.
 */

import type { GameState } from '@/core/GameState';
import type { AugmentLevel, SkillInstance } from '@/types/game';
import { computeSkillStats, getSkillDefinition } from '@/data/skills';
import { getSynergyRecipe } from '@/data/synergies';
import { PALETTE } from '@/assets/palette';
import { skillIcon, uiIcon } from '@/assets/SvgIcons';
import { SCREEN_CLASS, button, el } from './dom';

export interface PauseActions {
  onResume: () => void;
  onExit: () => void;
}

const AUGMENT_LEVELS: readonly AugmentLevel[] = [3, 7, 10];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class PauseMenu {
  readonly root: HTMLDivElement;
  private readonly mainView: HTMLDivElement;
  private readonly upgradesView: HTMLDivElement;

  constructor(private readonly state: GameState, private readonly actions: PauseActions) {
    this.root = el('div', `${SCREEN_CLASS} items-center justify-center px-4`);
    this.root.dataset.ui = 'pause';

    this.mainView = this.buildMain();
    this.upgradesView = this.buildUpgrades();
    this.upgradesView.style.display = 'none';

    this.root.append(this.mainView, this.upgradesView);
  }

  private buildMain(): HTMLDivElement {
    const view = el('div', 'flex w-full max-w-[400px] flex-col items-center gap-4');
    const header = el('div', 'flex flex-col items-center gap-1 text-center');
    header.append(
      el('div', 'font-mono text-[9px] tracking-[0.4em] text-crimson', 'ТЕНЬ ЗАМЕРЛА'),
      el('h2', 'font-display text-4xl font-bold tracking-wide text-bone', 'ПАУЗА'),
      el(
        'div',
        'font-mono text-[10px] tracking-[0.18em] text-ash',
        `${formatTime(this.state.timer.elapsed)} · УБИЙСТВ ${this.state.kills} · УР. ${this.state.player.level}`,
      ),
      el('div', 'ink-rule mt-1 w-40'),
    );

    const panel = el('div', 'neo-panel chamfer flex w-full flex-col gap-2 p-3');
    panel.style.background = PALETTE.slate;

    const resume = this.action('ПРОДОЛЖИТЬ', PALETTE.jade);
    resume.addEventListener('click', this.actions.onResume);

    const upgrades = this.action('АПГРЕЙДЫ', PALETTE.gold);
    upgrades.addEventListener('click', () => this.showUpgrades());

    const exit = this.action('ВЫЙТИ В МЕНЮ', PALETTE.crimson);
    exit.addEventListener('click', this.actions.onExit);

    panel.append(resume, upgrades, exit);

    const hint = el(
      'div',
      'font-mono text-[8px] tracking-[0.16em] text-ash/70 text-center',
      'СИСТЕМНАЯ КНОПКА «НАЗАД» ИЛИ ESC — ПРОДОЛЖИТЬ',
    );

    view.append(header, panel, hint);
    return view;
  }

  private buildUpgrades(): HTMLDivElement {
    const view = el('div', 'flex h-full w-full max-w-[440px] flex-col gap-3');
    view.style.paddingTop = 'max(calc(env(safe-area-inset-top,0px) + 14px), 24px)';
    view.style.paddingBottom = 'max(calc(env(safe-area-inset-bottom,0px) + 14px), 20px)';

    const header = el('div', 'flex items-center justify-between gap-3');
    const titleBox = el('div', 'flex flex-col');
    titleBox.append(
      el('div', 'font-mono text-[8px] tracking-[0.32em] text-gold', 'АРСЕНАЛ'),
      el('h2', 'font-display text-2xl font-bold text-bone', 'Купленные улучшения'),
    );
    const back = button('neo-btn chamfer-sm px-3 py-2 font-mono text-[9px] tracking-widest', 'НАЗАД');
    back.addEventListener('click', () => this.showMain());
    header.append(titleBox, back);

    const list = el('div', 'neo-scroll flex flex-1 flex-col gap-2 overflow-y-auto pb-2');

    if (this.state.skills.length === 0) {
      list.append(el('div', 'neo-panel chamfer p-4 text-center text-xs text-ash', 'Скиллы ещё не изучены.'));
    }

    for (const skill of this.state.skills) list.appendChild(this.skillCard(skill));

    view.append(header, list);
    return view;
  }

  private skillCard(skill: SkillInstance): HTMLDivElement {
    const def = getSkillDefinition(skill.id);
    const stats = computeSkillStats(skill);
    const synergy = skill.synergyId ? getSynergyRecipe(skill.synergyId) : undefined;
    const card = el('div', 'neo-panel chamfer relative flex flex-col gap-2 p-3');
    card.style.background = PALETTE.slate;
    if (synergy) card.classList.add('neo-panel--gold');

    const top = el('div', 'flex items-center gap-2.5');
    const icon = el('span', 'shrink-0 leading-none');
    icon.innerHTML = skillIcon(skill.id, 42);
    const nameBox = el('div', 'flex min-w-0 flex-1 flex-col');
    nameBox.append(
      el('div', 'font-display text-[13px] font-bold leading-tight text-bone', synergy?.name ?? def?.name ?? skill.id),
      el(
        'div',
        'font-mono text-[8px] tracking-[0.16em] text-ash',
        `УРОН ${Math.round(stats.damage)} · КД ${stats.cooldown.toFixed(2)}С`,
      ),
    );
    const level = el('div', 'font-mono text-[10px] font-bold text-goldlight', `УР. ${skill.level}/10`);
    top.append(icon, nameBox, level);

    const augments = el('div', 'flex flex-col gap-1.5 border-t border-white/10 pt-2');
    for (const augmentLevel of AUGMENT_LEVELS) {
      const augment = def?.augments.find((entry) => entry.level === augmentLevel);
      if (!augment) continue;
      const unlocked = skill.level >= augmentLevel;
      const row = el('div', 'flex items-start gap-2');
      const dot = el('span', 'mt-1 h-1.5 w-1.5 shrink-0 rotate-45');
      dot.style.background = unlocked ? PALETTE.gold : PALETTE.ash;
      const body = el('div', 'flex min-w-0 flex-col');
      const title = el(
        'span',
        'font-display text-[10px] leading-tight',
        `${augmentLevel} УР. · ${augment.name}`,
      );
      title.style.color = unlocked ? PALETTE.goldLight : PALETTE.ash;
      body.append(title, el('span', 'text-[9px] leading-snug text-ash/80', augment.description));
      if (!unlocked) {
        const lock = el('span', 'font-mono text-[7px] tracking-widest text-crimson/80', 'ЗАКРЫТО');
        body.appendChild(lock);
      }
      row.append(dot, body);
      augments.appendChild(row);
    }

    if (synergy) {
      augments.append(
        el(
          'div',
          'mt-1 border-t border-gold/20 pt-1.5 font-mono text-[8px] leading-snug text-gold/80',
          synergy.description,
        ),
      );
    }

    card.append(top, augments);
    return card;
  }

  private action(label: string, color: string): HTMLButtonElement {
    const node = button(
      'neo-btn chamfer w-full py-3.5 text-center font-display text-base font-bold',
      label,
    );
    node.style.background = PALETTE.slate;
    node.style.borderColor = color;
    node.style.color = PALETTE.bone;
    node.style.boxShadow = `inset 0 0 0 1px ${color}55`;
    return node;
  }

  private showMain(): void {
    this.upgradesView.style.display = 'none';
    this.mainView.style.display = 'flex';
  }

  private showUpgrades(): void {
    this.mainView.style.display = 'none';
    this.upgradesView.style.display = 'flex';
  }

  /** Static icon used by the HUD pause trigger for visual parity. */
  static icon(size = 22): string {
    return uiIcon('pause', size);
  }
}
