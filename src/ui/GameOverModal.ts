/**
 * Run summary: survival time, kills, per-skill damage/DPS.
 * Neo-Edo ink styling.
 */

import type { RunStats, SkillId } from '@/types/game';
import { getSkillDefinition } from '@/data/skills';
import { PALETTE } from '@/assets/palette';
import { skillIcon, uiIcon, type UiIconName } from '@/assets/SvgIcons';
import { SCREEN_CLASS, button, el } from './dom';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class GameOverModal {
  readonly root: HTMLDivElement;

  constructor(stats: RunStats, onRestart: () => void) {
    this.root = el('div', `${SCREEN_CLASS} items-center justify-center gap-4 px-5`);
    this.root.dataset.ui = 'gameover';

    const header = el('div', 'flex flex-col items-center gap-1 text-center');
    header.append(
      el('div', 'font-mono text-[9px] tracking-[0.4em] text-crimson', 'ТЕНЬ РАССЕЯЛАСЬ'),
      el('h2', 'font-display text-3xl font-bold tracking-wide text-bone', 'Забег окончен'),
      el('div', 'font-mono text-xs text-ash', `ВЫЖИЛ ${formatTime(stats.survivalTime)}`),
      el('div', 'ink-rule mt-1 w-36'),
    );

    const grid = el('div', 'grid w-full max-w-[430px] grid-cols-2 gap-2');
    grid.append(
      this.statTile('УБИЙСТВА', String(stats.kills), PALETTE.gold, 'kills'),
      this.statTile('УРОВЕНЬ', String(stats.level), PALETTE.jade, 'xp'),
      this.statTile('ВСЕГО УРОНА', String(Math.round(stats.totalDamage)), PALETTE.crimson, 'hp'),
      this.statTile(
        'DPS',
        stats.survivalTime > 0 ? String(Math.round(stats.totalDamage / stats.survivalTime)) : '0',
        PALETTE.goldLight,
        'timer',
      ),
    );

    const list = el('div', 'neo-panel chamfer flex w-full max-w-[430px] flex-col gap-1.5 p-3');
    list.style.background = PALETTE.slate;
    const listHeader = el('div', 'mb-0.5 flex items-center justify-between');
    listHeader.append(
      el('span', 'font-mono text-[8px] tracking-[0.28em] text-ash', 'УРОН ПО ШКОЛАМ'),
      el('span', 'font-mono text-[8px] tracking-[0.2em] text-gold/70', 'УРОН · DPS'),
    );
    list.append(listHeader);

    const entries = Object.entries(stats.perSkill)
      .filter((entry): entry is [SkillId, NonNullable<(typeof stats.perSkill)[SkillId]>] => entry[1] !== undefined)
      .sort((a, b) => b[1].damage - a[1].damage)
      .slice(0, 6);

    if (entries.length === 0) {
      list.append(el('div', 'text-[10px] text-ash', 'Клинки не успели напиться крови.'));
    }

    for (const [id, skillStats] of entries) {
      const row = el('div', 'flex items-center gap-2 border-t border-white/5 pt-1.5 text-xs');
      const icon = el('span', 'shrink-0 leading-none');
      icon.innerHTML = skillIcon(id, 22);
      const name = el(
        'span',
        'min-w-0 flex-1 truncate font-display text-[11px] text-bone',
        getSkillDefinition(id)?.name ?? id,
      );
      const dps = stats.survivalTime > 0 ? Math.round(skillStats.damage / stats.survivalTime) : 0;
      const value = el(
        'span',
        'shrink-0 font-mono text-[10px] tabular-nums text-goldlight',
        `${Math.round(skillStats.damage)} · ${dps}/с`,
      );
      row.append(icon, name, value);
      list.appendChild(row);
    }

    const restart = button(
      'neo-btn chamfer w-full max-w-[430px] py-4 text-center font-display text-lg font-bold',
      'ЕЩЁ РАЗ',
    );
    restart.style.background = PALETTE.crimson;
    restart.style.borderColor = PALETTE.gold;
    restart.style.color = PALETTE.bone;
    restart.style.boxShadow = 'inset 0 0 0 3px rgba(11,12,16,0.55)';
    restart.addEventListener('click', onRestart);

    this.root.append(header, grid, list, restart);
  }

  private statTile(label: string, value: string, color: string, icon: UiIconName): HTMLDivElement {
    const tile = el('div', 'neo-panel chamfer-sm relative flex items-center gap-2 px-3 py-2');
    tile.style.background = PALETTE.ink;
    const iconBox = el('span', 'shrink-0 leading-none');
    iconBox.innerHTML = uiIcon(icon, 26);
    const body = el('div', 'flex min-w-0 flex-col');
    const valueNode = el('div', 'font-mono text-lg font-bold leading-none tabular-nums', value);
    valueNode.style.color = color;
    body.append(valueNode, el('div', 'mt-0.5 font-mono text-[7px] tracking-[0.2em] text-ash', label));
    tile.append(iconBox, body);
    return tile;
  }
}
