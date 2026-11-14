/**
 * Bespoke inline SVG icon set: enso ink backdrop + weapon silhouette + accent.
 * No emojis, no external icon packs, no per-frame DOM writes.
 */

import type { SkillId } from '@/types/game';
import { PALETTE, SKILL_ACCENT } from './palette';

const C = PALETTE;

function shape(d: string, fill: string = C.bone, opacity = 1): string {
  return (
    `<path d="${d}" fill="${C.outline}" stroke="${C.outline}" stroke-width="3.4" ` +
    `stroke-linejoin="round" transform="translate(1.2 1.2)" opacity="${opacity}"/>` +
    `<path d="${d}" fill="${fill}" stroke="${C.outline}" stroke-width="1.3" ` +
    `stroke-linejoin="round" opacity="${opacity}"/>`
  );
}

function stroke(d: string, color: string = C.bone, width = 2.4, opacity = 1): string {
  return (
    `<path d="${d}" fill="none" stroke="${C.outline}" stroke-width="${width + 1.8}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
  );
}

function enso(accent: string): string {
  return (
    `<g fill="none" stroke="${C.ash}" stroke-linecap="round">` +
    `<circle cx="32" cy="32" r="25" stroke-width="2.2" stroke-dasharray="112 45" opacity=".42" transform="rotate(-32 32 32)"/>` +
    `<circle cx="32" cy="32" r="28" stroke-width=".9" stroke-dasharray="1.5 5.5" opacity=".28"/>` +
    `</g>` +
    `<g fill="${accent}"><circle cx="54" cy="12" r="2" opacity=".9"/>` +
    `<circle cx="10" cy="50" r="1.3" opacity=".7"/></g>`
  );
}

const GLYPHS: Record<SkillId, string> = {
  kunai:
    shape('M32 7 L41 27 L32 43 L23 27 Z') +
    stroke('M32 41 L32 54', C.ash, 3) +
    `<circle cx="32" cy="57" r="4" fill="none" stroke="${C.gold}" stroke-width="2"/>` +
    stroke('M32 12 L37 27', C.crimson, 1.4),

  shuriken:
    shape('M32 6 L38 26 L58 32 L38 38 L32 58 L26 38 L6 32 L26 26 Z') +
    `<circle cx="32" cy="32" r="5" fill="${C.ink}" stroke="${C.gold}" stroke-width="2"/>` +
    `<circle cx="32" cy="32" r="1.6" fill="${C.crimson}"/>`,

  katana:
    shape('M13 51 C22 33 35 19 53 10 L57 15 C40 25 28 39 20 55 Z') +
    stroke('M14 52 L20 58', C.gold, 4) +
    stroke('M15 47 C25 32 37 21 52 13', C.crimson, 1.4),

  smoke:
    shape(
      'M17 45 C7 45 7 31 17 30 C17 18 33 14 39 24 C50 20 57 30 51 38 C59 42 55 52 46 51 L20 51 C15 51 13 48 17 45 Z',
      C.ash,
      0.92,
    ) +
    `<circle cx="24" cy="38" r="4" fill="${C.jade}" opacity=".9"/>` +
    `<circle cx="36" cy="32" r="2.6" fill="${C.jade}" opacity=".7"/>` +
    `<circle cx="43" cy="42" r="3.2" fill="${C.goldLight}" opacity=".55"/>`,

  seals:
    shape('M23 9 H43 V41 L33 50 L23 41 Z', C.goldLight) +
    stroke('M28 17 H38 M28 24 H38 M28 31 H35', C.outline, 2) +
    stroke('M43 14 C51 12 53 8 54 5', C.ash, 1.6) +
    `<circle cx="54" cy="5" r="2.6" fill="${C.crimson}"/>`,

  kusarigama:
    shape('M18 46 C20 26 34 15 51 13 C43 28 34 37 22 41 Z', C.ash) +
    stroke('M14 50 L30 38', C.gold, 4) +
    `<g fill="none" stroke="${C.bone}" stroke-width="1.8">` +
    `<circle cx="12" cy="55" r="2.6"/><circle cx="8" cy="50" r="2.4"/>` +
    `<circle cx="11" cy="44" r="2.2"/></g>`,

  lightning:
    shape('M36 5 L17 34 H29 L24 59 L47 27 H34 Z', C.goldLight) +
    stroke('M32 12 L22 31', C.crimson, 1.4) +
    `<circle cx="24" cy="59" r="1.8" fill="${C.crimson}"/>`,

  senbon:
    stroke('M14 51 L44 13', C.bone, 3) +
    stroke('M20 55 L49 18', C.bone, 2.4) +
    stroke('M10 45 L38 9', C.bone, 2) +
    `<circle cx="45" cy="12" r="2" fill="${C.crimson}"/>` +
    `<circle cx="50" cy="17" r="1.7" fill="${C.crimson}"/>` +
    `<circle cx="39" cy="8" r="1.5" fill="${C.crimson}"/>`,

  fireball:
    shape(
      'M32 7 C46 19 53 33 45 46 C39 56 24 57 18 48 C11 38 19 28 26 23 C24 33 29 37 34 39 C39 30 36 20 32 7 Z',
      C.crimson,
    ) +
    shape(
      'M32 26 C39 32 39 41 33 44 C27 42 25 34 32 26 Z',
      C.goldLight,
      0.95,
    ),

  shadowClone:
    `<g opacity=".42" transform="translate(11 3)">` +
    shape('M20 53 C20 41 24 35 32 35 C40 35 44 41 44 53 Z', C.ash) +
    shape('M38 24 A6 6 0 1 1 26 24 A6 6 0 1 1 38 24 Z', C.ash) +
    `</g>` +
    shape('M17 53 C17 40 22 33 32 33 C42 33 47 40 47 53 Z', C.bone) +
    shape('M38 22 A6 6 0 1 1 26 22 A6 6 0 1 1 38 22 Z', C.bone) +
    stroke('M26 25 L32 30 L38 25', C.crimson, 1.6),

  makibishi:
    shape('M18 26 L25 43 L11 43 Z', C.ash) +
    shape('M36 22 L44 41 L28 41 Z', C.bone) +
    shape('M27 37 L34 54 L20 54 Z', C.ash) +
    stroke('M18 24 L14 16 M36 20 L39 11 M27 37 L23 28', C.gold, 1.6),

  iceFan:
    shape('M12 51 L50 12 C55 31 47 47 32 54 Z', C.jade) +
    stroke('M18 48 L48 18', C.bone, 1.4) +
    stroke('M20 51 L50 24', C.bone, 1.2) +
    stroke('M24 53 L52 31', C.bone, 1) +
    `<circle cx="47" cy="15" r="2" fill="${C.bone}"/>`,

  crows:
    shape(
      'M8 38 C18 24 27 24 34 31 C40 20 53 19 57 28 C49 29 44 34 40 41 C34 50 23 47 17 45 C12 43 8 41 8 38 Z',
      C.ash,
    ) +
    `<circle cx="49" cy="27" r="1.8" fill="${C.crimson}"/>` +
    stroke('M31 33 L26 39 M38 34 L34 41', C.bone, 1.2, 0.8),

  ghostDash:
    `<g opacity=".35" transform="translate(-9 2)">` +
    shape('M25 52 C25 41 29 36 36 36 C43 36 47 41 47 52 Z', C.jade) +
    shape('M42 27 A5.5 5.5 0 1 1 31 27 A5.5 5.5 0 1 1 42 27 Z', C.jade) +
    `</g>` +
    shape('M23 52 C23 40 27 34 35 34 C43 34 47 40 47 52 Z', C.bone) +
    shape('M41 25 A6 6 0 1 1 29 25 A6 6 0 1 1 41 25 Z', C.bone) +
    `<path d="M8 46 L34 16" fill="none" stroke="${C.gold}" stroke-width="2.4" stroke-dasharray="5 5" stroke-linecap="round"/>` +
    stroke('M34 16 L28 17 M34 16 L33 22', C.gold, 2),

  lantern:
    shape('M32 9 V15', C.gold, 0.9) +
    shape('M21 18 H43 L47 43 H17 Z', C.goldLight, 0.95) +
    stroke('M24 21 V40 M32 21 V40 M40 21 V40', C.outline, 1.2, 0.6) +
    shape('M32 24 C38 30 37 38 32 41 C27 38 26 30 32 24 Z', C.jade) +
    stroke('M23 48 H41', C.gold, 2),

  bamboo:
    shape('M17 56 H25 V12 H17 Z', C.jade) +
    shape('M34 56 H42 V19 H34 Z', C.jade, 0.9) +
    stroke('M17 22 H25 M17 34 H25 M17 45 H25', C.outline, 1.4, 0.7) +
    stroke('M34 29 H42 M34 41 H42', C.outline, 1.4, 0.7) +
    shape('M8 56 L15 41 L20 56 Z', C.bone, 0.85) +
    shape('M43 56 L48 45 L53 56 Z', C.bone, 0.85),

  oniMask:
    shape('M16 23 C20 11 44 11 48 23 L52 39 C46 51 18 51 12 39 Z', C.bone) +
    shape('M18 22 L10 7 L25 16 Z', C.gold) +
    shape('M46 22 L54 7 L39 16 Z', C.gold) +
    `<path d="M22 29 L28 32 L22 35 Z" fill="${C.crimson}"/>` +
    `<path d="M42 29 L36 32 L42 35 Z" fill="${C.crimson}"/>` +
    stroke('M24 41 L28 44 M40 41 L36 44', C.outline, 1.8),

  waterDragon:
    shape(
      'M8 47 C20 47 15 31 29 29 C42 27 43 15 55 13 L55 21 C47 25 45 34 33 37 C19 40 24 54 8 55 Z',
      C.jade,
    ) +
    `<circle cx="51" cy="17" r="1.8" fill="${C.goldLight}"/>` +
    stroke('M12 49 C22 49 20 40 29 38', C.bone, 1.2, 0.7),

  mirror:
    `<circle cx="32" cy="32" r="19" fill="none" stroke="${C.gold}" stroke-width="3"/>` +
    `<circle cx="32" cy="32" r="15" fill="none" stroke="${C.goldLight}" stroke-width="1" opacity=".7"/>` +
    shape('M32 15 L38 30 L32 47 L26 30 Z', C.bone) +
    stroke('M32 18 L35 30', C.crimson, 1.4) +
    `<circle cx="49" cy="15" r="2" fill="${C.jade}"/>`,

  reaper:
    stroke('M32 56 V22', C.ash, 3.4) +
    shape('M18 22 C28 8 46 7 55 15 C42 16 34 22 30 33 Z', C.bone) +
    `<circle cx="32" cy="36" r="11" fill="none" stroke="${C.crimson}" stroke-width="2" stroke-dasharray="8 4"/>` +
    stroke('M27 43 L37 33', C.crimson, 2.2),
};

const UI_GLYPHS = {
  ult:
    `<g fill="none" stroke="${C.crimson}" stroke-width="2" opacity=".55">` +
    `<circle cx="32" cy="32" r="22" stroke-dasharray="16 6"/>` +
    `<circle cx="32" cy="32" r="15" stroke-dasharray="9 5" transform="rotate(30 32 32)"/></g>` +
    shape('M32 10 L38 27 L32 38 L26 27 Z', C.bone) +
    shape('M14 40 L20 48 L13 50 Z', C.goldLight) +
    shape('M50 40 L44 48 L51 50 Z', C.goldLight) +
    stroke('M32 38 L32 54', C.gold, 2.4),
  hp:
    shape(
      'M32 53 C18 43 12 32 19 23 C24 16 32 21 32 27 C32 21 40 16 45 23 C52 32 46 43 32 53 Z',
      C.crimson,
    ) +
    stroke('M32 27 L32 45', C.goldLight, 1.6, 0.85),
  xp:
    `<circle cx="32" cy="32" r="16" fill="${C.jade}" opacity=".22"/>` +
    `<circle cx="32" cy="32" r="10" fill="${C.jade}" opacity=".5"/>` +
    `<circle cx="32" cy="32" r="4.5" fill="${C.goldLight}"/>` +
    `<circle cx="32" cy="32" r="21" fill="none" stroke="${C.jade}" stroke-width="1.4" stroke-dasharray="3 6"/>`,
  timer:
    `<circle cx="32" cy="34" r="18" fill="none" stroke="${C.bone}" stroke-width="2.4"/>` +
    stroke('M32 34 V22 M32 34 L41 39', C.gold, 2) +
    stroke('M26 11 H38', C.bone, 2.4),
  kills:
    shape('M13 52 C23 35 35 22 53 12 L56 18 C41 28 30 41 21 56 Z', C.ash) +
    stroke('M38 24 L48 34', C.crimson, 2.2) +
    `<circle cx="14" cy="53" r="2" fill="${C.crimson}"/>`,
  auto:
    `<path d="M17 26 A17 17 0 0 1 47 22" fill="none" stroke="${C.jade}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M47 22 L48 13 L39 17" fill="none" stroke="${C.jade}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M47 38 A17 17 0 0 1 17 42" fill="none" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M17 42 L16 51 L25 47" fill="none" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  pause:
    `<rect x="20" y="16" width="7" height="32" fill="${C.bone}" stroke="${C.outline}" stroke-width="1.4"/>` +
    `<rect x="37" y="16" width="7" height="32" fill="${C.bone}" stroke="${C.outline}" stroke-width="1.4"/>` +
    `<circle cx="32" cy="32" r="25" fill="none" stroke="${C.ash}" stroke-width="1.6" stroke-dasharray="6 8" opacity=".6"/>`,
} as const;

export type UiIconName = keyof typeof UI_GLYPHS;

function wrap(inner: string, size: number, accent: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" ` +
    `role="img" aria-hidden="true" focusable="false">${enso(accent)}${inner}</svg>`
  );
}

export function skillIcon(id: SkillId, size = 44): string {
  const accentName = SKILL_ACCENT[id] ?? 'bone';
  const accent = PALETTE[accentName];
  return wrap(GLYPHS[id], size, accent);
}

export function uiIcon(name: UiIconName, size = 28): string {
  return wrap(UI_GLYPHS[name], size, C.ash);
}
