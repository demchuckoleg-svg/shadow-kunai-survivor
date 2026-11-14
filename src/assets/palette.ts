/**
 * Neo-Edo Ink color tokens. Single source of truth for UI and Pixi.
 * No gradients, no purple/pink accents.
 */

export const PALETTE = {
  ink: '#0B0C10',
  slate: '#14161D',
  crimson: '#E63946',
  gold: '#D4AF37',
  goldLight: '#F3E5AB',
  jade: '#2EC4B6',
  bone: '#F1FAEE',
  ash: '#8D99AE',
  outline: '#050507',
} as const;

export type PaletteName = keyof typeof PALETTE;

/** Pixi accepts numeric 0xRRGGBB colors. */
export const PIXI_COLORS: Record<PaletteName, number> = {
  ink: 0x0b0c10,
  slate: 0x14161d,
  crimson: 0xe63946,
  gold: 0xd4af37,
  goldLight: 0xf3e5ab,
  jade: 0x2ec4b6,
  bone: 0xf1faee,
  ash: 0x8d99ae,
  outline: 0x050507,
};

export function hexToNumber(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

export function withAlpha(hex: string, alpha: number): string {
  const value = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `${hex}${value.toString(16).padStart(2, '0')}`;
}

/** Skill accent colors stay within the strict palette. */
export const SKILL_ACCENT: Record<string, PaletteName> = {
  kunai: 'bone',
  shuriken: 'jade',
  katana: 'crimson',
  smoke: 'jade',
  seals: 'gold',
  kusarigama: 'ash',
  lightning: 'goldLight',
  senbon: 'crimson',
  fireball: 'crimson',
  shadowClone: 'ash',
  makibishi: 'ash',
  iceFan: 'jade',
  crows: 'ash',
  ghostDash: 'jade',
  lantern: 'gold',
  bamboo: 'jade',
  oniMask: 'crimson',
  waterDragon: 'jade',
  mirror: 'goldLight',
  reaper: 'bone',
};
