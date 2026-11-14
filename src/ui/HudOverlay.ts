/**
 * Combat HUD: HP/XP, level, timer, kills, active schools, ultimate button.
 * Neo-Edo ink styling; DOM updates at 5 Hz, never per frame.
 */

import type { GameState } from '@/core/GameState';
import type { SkillInstance } from '@/types/game';
import { getSkillDefinition } from '@/data/skills';
import { getSynergyRecipe } from '@/data/synergies';
import { PALETTE } from '@/assets/palette';
import { skillIcon, uiIcon } from '@/assets/SvgIcons';
import { button, el } from './dom';

export class HudOverlay {
  readonly root: HTMLDivElement;
  private readonly hpFill: HTMLDivElement;
  private readonly hpText: HTMLDivElement;
  private readonly xpFill: HTMLDivElement;
  private readonly xpText: HTMLDivElement;
  private readonly levelText: HTMLDivElement;
  private readonly timerText: HTMLDivElement;
  private readonly killsText: HTMLDivElement;
  private readonly skillList: HTMLDivElement;
  private readonly ultButton: HTMLButtonElement;
  private readonly ultCharge: HTMLSpanElement;
  private readonly autoButton: HTMLButtonElement;
  private skillSignature = '';

  constructor(
    onUltimate: () => void,
    onToggleAuto: (enabled: boolean) => void,
    onPause: () => void,
  ) {
    this.root = el('div', 'fixed inset-0 z-20 hidden');
    this.root.style.pointerEvents = 'none';
    this.root.style.padding =
      'max(calc(env(safe-area-inset-top,0px) + 10px), 28px) max(calc(env(safe-area-inset-right,0px) + 12px), 12px) max(calc(env(safe-area-inset-bottom,0px) + 16px), 18px) max(calc(env(safe-area-inset-left,0px) + 12px), 12px)';

    const top = el('div', 'relative flex items-start justify-between gap-3');

    const left = el('div', 'flex w-[48%] max-w-[250px] flex-col gap-1');
    const levelRow = el('div', 'flex items-center gap-2');
    const levelBadge = el('div', 'grid h-10 w-10 place-items-center font-display text-lg font-bold text-gold');
    levelBadge.style.background = PALETTE.slate;
    levelBadge.style.clipPath =
      'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)';
    levelBadge.style.boxShadow = `inset 0 0 0 1px ${PALETTE.gold}`;
    levelBadge.textContent = '忍';
    this.levelText = el('div', 'font-mono text-[11px] font-bold tracking-[0.18em] text-goldlight', 'УР 1');
    levelRow.append(levelBadge, this.levelText);

    const hpRow = el('div', 'flex items-center gap-1.5');
    const hpIcon = el('span', 'shrink-0 leading-none');
    hpIcon.innerHTML = uiIcon('hp', 20);
    const hpBar = el('div', 'chamfer-sm h-3 flex-1 overflow-hidden border border-ash/40');
    hpBar.style.background = 'rgba(241,250,238,0.08)';
    this.hpFill = el('div', 'h-full');
    this.hpFill.style.width = '100%';
    this.hpFill.style.background = PALETTE.crimson;
    hpBar.appendChild(this.hpFill);
    hpRow.append(hpIcon, hpBar);
    this.hpText = el('div', 'pl-6 font-mono text-[9px] tabular-nums text-ash', '100 / 100');

    const xpRow = el('div', 'flex items-center gap-1.5');
    const xpIcon = el('span', 'shrink-0 leading-none');
    xpIcon.innerHTML = uiIcon('xp', 18);
    const xpBar = el('div', 'chamfer-sm h-1.5 flex-1 overflow-hidden border border-jade/30');
    xpBar.style.background = 'rgba(46,196,182,0.10)';
    this.xpFill = el('div', 'h-full');
    this.xpFill.style.width = '0%';
    this.xpFill.style.background = PALETTE.jade;
    xpBar.appendChild(this.xpFill);
    xpRow.append(xpIcon, xpBar);
    this.xpText = el('div', 'pl-6 font-mono text-[8px] tabular-nums text-ash', '0 / 5 XP');

    left.append(levelRow, hpRow, this.hpText, xpRow, this.xpText);

    const timerBox = el('div', 'absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center');
    const timerIcon = el('span', 'leading-none');
    timerIcon.innerHTML = uiIcon('timer', 22);
    this.timerText = el('div', 'font-mono text-xl font-bold tabular-nums tracking-[0.12em] text-bone', '0:00');
    timerBox.append(timerIcon, this.timerText);

    const right = el('div', 'flex flex-col items-end gap-0.5');
    const killsIcon = el('span', 'leading-none');
    killsIcon.innerHTML = uiIcon('kills', 22);
    this.killsText = el('div', 'font-mono text-xl font-bold tabular-nums text-gold', '0');
    right.append(killsIcon, el('div', 'font-mono text-[8px] tracking-[0.24em] text-ash', 'УБИЙСТВА'), this.killsText);

    const pauseButton = button('mt-1.5 grid h-8 w-8 place-items-center border border-ash/40 bg-ink/70', '');
    pauseButton.style.pointerEvents = 'auto';
    pauseButton.style.clipPath = 'var(--chamfer-sm)';
    pauseButton.innerHTML = uiIcon('pause', 18);
    pauseButton.addEventListener('click', onPause);
    right.append(pauseButton);

    top.append(left, timerBox, right);

    this.skillList = el('div', 'absolute left-3 bottom-4 flex flex-col gap-1');
    this.skillList.style.paddingLeft = 'var(--safe-left)';
    this.skillList.style.paddingBottom = 'var(--safe-bottom)';

    this.ultButton = button(
      'absolute right-4 bottom-6 hidden h-[88px] w-[88px] flex flex-col items-center justify-center gap-0.5 text-center transition',
      '',
    );
    this.ultButton.style.pointerEvents = 'auto';
    this.ultButton.style.right = 'calc(18px + env(safe-area-inset-right,0px))';
    this.ultButton.style.bottom = 'max(calc(22px + env(safe-area-inset-bottom,0px)), 28px)';
    this.ultButton.style.background = PALETTE.crimson;
    this.ultButton.style.border = `2px solid ${PALETTE.gold}`;
    this.ultButton.style.clipPath =
      'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)';
    this.ultButton.style.boxShadow = 'inset 0 0 0 4px rgba(11,12,16,0.45)';
    const ultIcon = el('span', 'leading-none');
    ultIcon.innerHTML = uiIcon('ult', 38);
    this.ultCharge = el('span', 'font-mono text-[10px] font-bold tracking-widest text-bone', '0%');
    this.ultButton.append(ultIcon, this.ultCharge);
    this.ultButton.addEventListener('click', onUltimate);

    this.autoButton = button(
      'absolute bottom-6 hidden flex items-center gap-1 border border-ash/40 bg-ink/80 px-2.5 py-1.5 transition',
      'АВТО',
    );
    this.autoButton.style.pointerEvents = 'auto';
    this.autoButton.style.right = 'calc(116px + env(safe-area-inset-right,0px))';
    this.autoButton.style.bottom = 'max(calc(28px + env(safe-area-inset-bottom,0px)), 34px)';
    this.autoButton.style.clipPath = 'var(--chamfer-sm)';
    this.autoButton.style.fontFamily = 'var(--font-mono)';
    this.autoButton.style.fontSize = '9px';
    this.autoButton.style.letterSpacing = '0.16em';
    const autoIcon = el('span', 'leading-none');
    autoIcon.innerHTML = uiIcon('auto', 14);
    this.autoButton.prepend(autoIcon);
    this.autoButton.addEventListener('click', () => {
      const next = !this.autoButton.classList.contains('auto-on');
      this.setAuto(next);
      onToggleAuto(next);
    });

    this.root.append(top, this.skillList, this.ultButton, this.autoButton);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.root.classList.add('hidden');
  }

  setAuto(enabled: boolean): void {
    this.autoButton.classList.toggle('auto-on', enabled);
    this.autoButton.textContent = enabled ? 'АВТО ВКЛ' : 'АВТО';
    const icon = el('span', 'leading-none');
    icon.innerHTML = uiIcon('auto', 14);
    this.autoButton.prepend(icon);
    this.autoButton.style.color = enabled ? PALETTE.jade : PALETTE.ash;
    this.autoButton.style.borderColor = enabled ? PALETTE.jade : 'rgba(141,153,174,0.4)';
  }

  update(state: GameState, canUltimate: boolean, ultimateActive: boolean): void {
    const player = state.player;
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.hpFill.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    this.hpFill.style.background = hpPct <= 30 ? PALETTE.gold : PALETTE.crimson;

    const xpPct = Math.max(0, Math.min(100, (player.xp / Math.max(1, player.nextLevelXp)) * 100));
    this.xpFill.style.width = `${xpPct}%`;
    this.xpText.textContent = `${Math.floor(player.xp)} / ${player.nextLevelXp} XP`;
    this.levelText.textContent = `УР ${player.level}`;

    const minutes = Math.floor(state.timer.elapsed / 60);
    const seconds = Math.floor(state.timer.elapsed % 60);
    this.timerText.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    this.killsText.textContent = String(state.kills);

    this.ultButton.classList.toggle('hidden', !player.ultUnlocked);
    this.autoButton.classList.toggle('hidden', !player.ultUnlocked);
    if (player.ultUnlocked) {
      this.ultButton.disabled = !canUltimate && !ultimateActive;
      this.ultButton.style.opacity = ultimateActive ? '1' : canUltimate ? '1' : '0.55';
      this.ultCharge.textContent = ultimateActive ? 'ОГИ' : `${Math.floor(player.ultCharge)}%`;
    }

    this.refreshSkills(state.skills);
  }

  private refreshSkills(skills: readonly SkillInstance[]): void {
    const signature = skills.map((skill) => `${skill.id}:${skill.level}:${skill.synergyId ?? ''}`).join('|');
    if (signature === this.skillSignature) return;
    this.skillSignature = signature;
    this.skillList.replaceChildren();

    for (const skill of skills) {
      const def = getSkillDefinition(skill.id);
      const synergy = skill.synergyId ? getSynergyRecipe(skill.synergyId) : undefined;
      const name = synergy?.name ?? def?.name ?? skill.id;

      const chip = el('div', 'flex items-center gap-1.5 border border-ash/20 bg-ink/60 px-1.5 py-1 backdrop-blur-sm');
      chip.style.clipPath = 'var(--chamfer-sm)';

      const icon = el('span', 'shrink-0 leading-none');
      icon.innerHTML = skillIcon(skill.id, 20);

      const label = el(
        'span',
        'max-w-[104px] truncate font-display text-[9px] leading-none text-bone',
        name,
      );
      const level = el('span', 'font-mono text-[9px] font-bold leading-none text-goldlight', String(skill.level));
      chip.append(icon, label, level);
      if (synergy) chip.style.borderColor = 'rgba(212,175,55,0.55)';
      this.skillList.appendChild(chip);
    }
  }
}
