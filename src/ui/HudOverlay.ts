/**
 * HUD: HP, XP/уровень, таймер, убийства, скиллы и кнопка ульты 50 ур.
 * Зависимости: GameState, data/skills, data/synergies, types.
 */

import type { GameState } from '@/core/GameState';
import type { SkillInstance } from '@/types/game';
import { getSkillDefinition } from '@/data/skills';
import { getSynergyRecipe } from '@/data/synergies';
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
  private readonly autoButton: HTMLButtonElement;
  private skillSignature = '';

  constructor(onUltimate: () => void, onToggleAuto: (enabled: boolean) => void) {
    this.root = el('div', 'fixed inset-0 z-20 pointer-events-none hidden');
    this.root.style.padding =
      'calc(env(safe-area-inset-top,0px) + 10px) calc(env(safe-area-inset-right,0px) + 12px) calc(env(safe-area-inset-bottom,0px) + 16px) calc(env(safe-area-inset-left,0px) + 12px)';

    const top = el('div', 'flex items-start justify-between gap-3');

    const left = el('div', 'flex flex-col gap-1 min-w-0 w-[46%] max-w-[230px]');
    const levelRow = el('div', 'flex items-center gap-2');
    const levelBadge = el('div', 'grid place-items-center h-9 w-9 rounded-xl border border-[#35e6ff]/50 bg-[#071820] text-[#35e6ff] font-black text-sm');
    this.levelText = el('div', 'text-[#35e6ff] font-black text-sm', 'УР 1');
    levelBadge.appendChild(el('span', '', '忍'));
    levelRow.append(levelBadge, this.levelText);

    const hpBar = el('div', 'h-3 w-full rounded-full bg-white/10 overflow-hidden border border-white/10');
    this.hpFill = el('div', 'h-full rounded-full');
    this.hpFill.style.width = '100%';
    this.hpFill.style.background = 'linear-gradient(90deg,#ff2e4d,#ff7a8f)';
    hpBar.appendChild(this.hpFill);
    this.hpText = el('div', 'text-[10px] font-bold text-[#ffb3c1] tabular-nums', '100 / 100');

    const xpBar = el('div', 'h-1.5 w-full rounded-full bg-white/10 overflow-hidden');
    this.xpFill = el('div', 'h-full rounded-full');
    this.xpFill.style.width = '0%';
    this.xpFill.style.background = 'linear-gradient(90deg,#35e6ff,#9be15d)';
    xpBar.appendChild(this.xpFill);
    this.xpText = el('div', 'text-[9px] text-[#8b93a7] tabular-nums', '0 / 10 XP');

    left.append(levelRow, hpBar, this.hpText, xpBar, this.xpText);

    this.timerText = el('div', 'text-xl font-black tabular-nums tracking-wider text-[#f4f4f8] drop-shadow-[0_0_12px_rgba(53,230,255,0.35)]', '0:00');

    const right = el('div', 'flex flex-col items-end gap-0.5');
    right.append(
      el('div', 'text-[9px] tracking-[0.25em] text-[#8b93a7] font-bold', 'УБИЙСТВА'),
      (this.killsText = el('div', 'text-xl font-black tabular-nums text-[#ffc94a]', '0')),
    );

    top.append(left, this.timerText, right);

    this.skillList = el('div', 'absolute left-3 bottom-4 flex flex-col gap-1');
    this.skillList.style.paddingLeft = 'var(--safe-left)';
    this.skillList.style.paddingBottom = 'var(--safe-bottom)';

    this.ultButton = button(
      'absolute right-4 bottom-6 h-[86px] w-[86px] rounded-full grid place-items-center whitespace-pre text-center font-black text-[13px] leading-tight text-[#ffe9ee] transition disabled:opacity-50 pointer-events-auto hidden',
      'УЛЬТ\n0%',
    );
    this.ultButton.style.background =
      'radial-gradient(circle at 35% 30%, rgba(255,46,77,0.9), rgba(90,6,24,0.95))';
    this.ultButton.style.border = '2px solid rgba(255,120,140,0.85)';
    this.ultButton.style.boxShadow = '0 0 30px rgba(255,46,77,0.55)';
    this.ultButton.style.right = 'calc(18px + env(safe-area-inset-right,0px))';
    this.ultButton.style.bottom = 'calc(22px + env(safe-area-inset-bottom,0px))';
    this.ultButton.addEventListener('click', onUltimate);

    this.autoButton = button(
      'absolute right-[112px] bottom-6 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-black tracking-wider text-[#9aa3b8] pointer-events-auto hidden',
      'АВТО',
    );
    this.autoButton.style.right = 'calc(112px + env(safe-area-inset-right,0px))';
    this.autoButton.style.bottom = 'calc(28px + env(safe-area-inset-bottom,0px))';
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
    this.autoButton.style.color = enabled ? '#35e6ff' : '#9aa3b8';
    this.autoButton.style.borderColor = enabled ? 'rgba(53,230,255,0.7)' : 'rgba(255,255,255,0.2)';
  }

  update(state: GameState, canUltimate: boolean, ultimateActive: boolean): void {
    const player = state.player;
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.hpFill.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
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
      this.ultButton.textContent = ultimateActive
        ? 'ОГИ!'
        : `УЛЬТ\n${Math.floor(player.ultCharge)}%`;
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
      const chip = el('div', 'flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2 py-1 backdrop-blur-sm');
      const dot = el('span', 'h-1.5 w-1.5 rounded-full');
      const color = synergy ? 0xffc94a : (def?.color ?? 0xffffff);
      dot.style.background = `#${color.toString(16).padStart(6, '0')}`;
      dot.style.boxShadow = `0 0 8px #${color.toString(16).padStart(6, '0')}`;
      chip.append(
        dot,
        el('span', 'max-w-[110px] truncate text-[10px] text-[#c9d3e6]', name),
        el('span', 'text-[10px] font-black text-[#35e6ff]', String(skill.level)),
      );
      this.skillList.appendChild(chip);
    }
  }
}
