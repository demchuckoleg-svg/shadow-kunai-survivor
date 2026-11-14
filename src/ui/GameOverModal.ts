/**
 * Экран итогов забега: время, убийства, уровень, урон и DPS по скиллам.
 * Зависимости: types, data/skills, ui/dom.
 */

import type { RunStats, SkillId } from '@/types/game';
import { getSkillDefinition } from '@/data/skills';
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
      el('div', 'text-[11px] tracking-[0.35em] text-[#ff2e4d] font-bold', 'ТЕНЬ РАССЕЯЛАСЬ'),
      el('h2', 'text-3xl font-black tracking-wide', 'Забег окончен'),
      el('div', 'text-sm text-[#9aa3b8]', `Выжил ${formatTime(stats.survivalTime)}`),
    );

    const grid = el('div', 'grid w-full max-w-[420px] grid-cols-2 gap-2');
    grid.append(
      this.statTile('УБИЙСТВА', String(stats.kills), '#ffc94a'),
      this.statTile('УРОВЕНЬ', String(stats.level), '#35e6ff'),
      this.statTile('ВСЕГО УРОНА', String(Math.round(stats.totalDamage)), '#9be15d'),
      this.statTile(
        'DPS',
        stats.survivalTime > 0 ? String(Math.round(stats.totalDamage / stats.survivalTime)) : '0',
        '#c084fc',
      ),
    );

    const list = el('div', 'flex w-full max-w-[420px] flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3');
    list.append(el('div', 'mb-1 text-[10px] font-black tracking-[0.2em] text-[#8b93a7]', 'УРОН ПО СКИЛЛАМ'));

    const entries = Object.entries(stats.perSkill)
      .filter((entry): entry is [SkillId, NonNullable<(typeof stats.perSkill)[SkillId]>] => entry[1] !== undefined)
      .sort((a, b) => b[1].damage - a[1].damage)
      .slice(0, 6);

    if (entries.length === 0) {
      list.append(el('div', 'text-xs text-[#6f7890]', 'Скиллы не успели проявить себя.'));
    }

    for (const [id, skillStats] of entries) {
      const row = el('div', 'flex items-center justify-between gap-3 text-xs');
      const name = el('span', 'truncate text-[#c9d3e6]', getSkillDefinition(id)?.name ?? id);
      const dps = stats.survivalTime > 0 ? Math.round(skillStats.damage / stats.survivalTime) : 0;
      const value = el('span', 'shrink-0 font-bold tabular-nums text-[#ffc94a]', `${Math.round(skillStats.damage)} · ${dps}/с`);
      row.append(name, value);
      list.appendChild(row);
    }

    const restart = button(
      'w-full max-w-[420px] rounded-2xl py-4 font-black tracking-wider text-[#04141a]',
      'ЕЩЁ РАЗ',
    );
    restart.style.background = 'linear-gradient(90deg,#ff2e4d,#ffc94a)';
    restart.style.boxShadow = '0 0 28px rgba(255,46,77,0.35)';
    restart.addEventListener('click', onRestart);

    this.root.append(header, grid, list, restart);
  }

  private statTile(label: string, value: string, color: string): HTMLDivElement {
    const tile = el('div', 'flex flex-col gap-0.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2');
    const valueNode = el('div', 'text-xl font-black tabular-nums', value);
    valueNode.style.color = color;
    tile.append(valueNode, el('div', 'text-[9px] font-bold tracking-[0.18em] text-[#8b93a7]', label));
    return tile;
  }
}
