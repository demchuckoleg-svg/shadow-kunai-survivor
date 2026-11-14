import type { AugmentDefinition, SkillDefinition, SkillId, SkillInstance } from '@/types/game';
import { getSynergyModifiers } from './synergies';
import { SKILLS_EXTRA_1 } from './skillsExtra1';
import { SKILLS_EXTRA_2 } from './skillsExtra2';

/**
 * Декларативные конфиги скиллов. Здесь только числа/тексты/теги.
 * Шаг 4: первые 5 способностей. Остальные 15 добавляются на шаге 6.
 */

const kunaiAugments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition] = [
  {
    level: 3,
    name: 'Двойное пробитие',
    description: 'Кунаи пробивают +1 врага насквозь.',
    flags: ['pierceBonus'],
  },
  {
    level: 7,
    name: 'Веер Теней',
    description: 'Каждый 3-й залп — широкий веер из 5 кунаев.',
    flags: ['fanVolley'],
  },
  {
    level: 10,
    name: 'Клинки, что возвращаются',
    description: 'Кунаи получают самонаводку и рикошетят до 4 раз.',
    flags: ['homingRicochet'],
  },
];

const shurikenAugments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition] = [
  {
    level: 3,
    name: 'Широкий Вихрь',
    description: 'Радиус орбиты +35%, сюрикены сильно отталкивают врагов.',
    flags: ['orbitWidePush'],
    modifiers: { radiusMultiplier: 1.35 },
  },
  {
    level: 7,
    name: 'Срыв',
    description: 'При критическом ударе сюрикен срывается в цель как снаряд.',
    flags: ['orbitCritLaunch'],
  },
  {
    level: 10,
    name: 'Обратное Кольцо',
    description: 'Второе внешнее кольцо гигантских сюрикенов вращается навстречу.',
    flags: ['orbitOuterRing'],
    modifiers: { damageMultiplier: 1.15 },
  },
];

const katanaAugments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition] = [
  {
    level: 3,
    name: 'Луна и Тень',
    description: 'Удар бьёт спереди и сзади, накладывая кровотечение.',
    flags: ['katanaBackSlash', 'katanaBleed'],
  },
  {
    level: 7,
    name: 'Серп Ветра',
    description: 'Взмах запускает волну энергии через весь экран.',
    flags: ['katanaEnergyWave'],
  },
  {
    level: 10,
    name: 'Крест Алой Луны',
    description: 'Серия из 3 ударов; по кровоточащим целям — 100% крит.',
    flags: ['katanaTripleCross'],
  },
];

const smokeAugments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition] = [
  {
    level: 3,
    name: 'Токсичный Туман',
    description: 'Враги в дыму замедляются на 30% и получают +20% урона.',
    flags: ['smokeSlowAmp'],
  },
  {
    level: 7,
    name: 'Пелена Смерти',
    description: 'Смерть врага в дыму создаёт новое облако.',
    flags: ['smokeOnDeath'],
  },
  {
    level: 10,
    name: 'Клоны в Дыму',
    description: 'Внутри дыма теневые клоны рубят врагов.',
    flags: ['smokeClones'],
    modifiers: { damageMultiplier: 1.2 },
  },
];

const sealAugments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition] = [
  {
    level: 3,
    name: 'Огненная Печать',
    description: 'Взрыв поджигает задетых врагов.',
    flags: ['sealIgnite'],
  },
  {
    level: 7,
    name: 'Детонатор',
    description: 'Смерть врага до таймера взрывает печать с двойным радиусом.',
    flags: ['sealInstantOnKill'],
  },
  {
    level: 10,
    name: 'Цепная Реакция',
    description: 'Метки вешаются на 10 врагов, взрыв разносит 3 новые печати.',
    flags: ['sealChain'],
    modifiers: { radiusMultiplier: 1.2 },
  },
];

const BASE_SKILLS: SkillDefinition[] = [
  {
    id: 'kunai',
    name: 'Кунаи Тьмы',
    description: 'Быстрый бросок в ближайшего врага.',
    behavior: 'projectile',
    color: 0xd7f6ff,
    baseDamage: 12,
    baseCooldown: 0.55,
    projectileCount: 1,
    projectileSpeed: 720,
    radius: 6,
    pierce: 0,
    homing: false,
    ricochet: 0,
    augments: kunaiAugments,
  },
  {
    id: 'shuriken',
    name: 'Вихрь Сюрикенов',
    description: 'Сюрикены вращаются по орбите вокруг ниндзя.',
    behavior: 'orbit',
    color: 0xbfefff,
    baseDamage: 9,
    baseCooldown: 0.8,
    projectileCount: 3,
    projectileSpeed: 0,
    radius: 12,
    pierce: 0,
    homing: false,
    ricochet: 0,
    augments: shurikenAugments,
  },
  {
    id: 'katana',
    name: 'Рассечение Катаной',
    description: 'Широкий серповидный удар перед героем.',
    behavior: 'meleeArc',
    color: 0xff2e4d,
    baseDamage: 26,
    baseCooldown: 1.05,
    projectileCount: 1,
    projectileSpeed: 640,
    radius: 128,
    pierce: 3,
    homing: false,
    ricochet: 0,
    augments: katanaAugments,
  },
  {
    id: 'smoke',
    name: 'Ядовитая Дымовая Бомба',
    description: 'Бросает под врагов облако дыма с периодическим уроном.',
    behavior: 'zone',
    color: 0x9be15d,
    baseDamage: 4,
    baseCooldown: 2.2,
    projectileCount: 1,
    projectileSpeed: 0,
    radius: 76,
    pierce: 0,
    homing: false,
    ricochet: 0,
    augments: smokeAugments,
  },
  {
    id: 'seals',
    name: 'Взрывные Печати',
    description: 'Вешает бумажные бомбы, детонирующие через 1.2 сек.',
    behavior: 'mark',
    color: 0xffc94a,
    baseDamage: 45,
    baseCooldown: 1.8,
    projectileCount: 2,
    projectileSpeed: 0,
    radius: 80,
    pierce: 0,
    homing: false,
    ricochet: 0,
    augments: sealAugments,
  },
];

const ALL_SKILLS: SkillDefinition[] = [...BASE_SKILLS, ...SKILLS_EXTRA_1, ...SKILLS_EXTRA_2];

export const SKILL_DEFINITIONS: Partial<Record<SkillId, SkillDefinition>> = Object.fromEntries(
  ALL_SKILLS.map((def) => [def.id, def]),
);

export function getSkillDefinition(id: SkillId): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[id];
}

export interface ComputedSkillStats {
  damage: number;
  cooldown: number;
  projectiles: number;
  radius: number;
  speed: number;
}

/** Линейный рост + модификаторы разблокированных аугментаций. */
export function computeSkillStats(skill: SkillInstance): ComputedSkillStats {
  const def = getSkillDefinition(skill.id);
  if (!def) {
    return { damage: 1, cooldown: 1, projectiles: 1, radius: 10, speed: 0 };
  }

  const level = Math.max(1, Math.min(10, skill.level));
  let damageMultiplier = 1 + 0.15 * (level - 1);
  let cooldownMultiplier = Math.max(0.42, 1 - 0.08 * (level - 1));
  let radiusMultiplier = 1 + 0.05 * (level - 1);

  if (skill.synergyId) {
    const synergyMods = getSynergyModifiers(skill.synergyId);
    damageMultiplier *= synergyMods.damageMultiplier ?? 1;
    cooldownMultiplier *= synergyMods.cooldownMultiplier ?? 1;
    radiusMultiplier *= synergyMods.radiusMultiplier ?? 1;
  }

  for (const augment of def.augments) {
    if (skill.augmentsUnlocked[augment.level] === undefined) continue;
    const mods = augment.modifiers;
    if (!mods) continue;
    damageMultiplier *= mods.damageMultiplier ?? 1;
    cooldownMultiplier *= mods.cooldownMultiplier ?? 1;
    radiusMultiplier *= mods.radiusMultiplier ?? 1;
  }

  return {
    damage: def.baseDamage * damageMultiplier,
    cooldown: def.baseCooldown * cooldownMultiplier,
    projectiles:
      def.projectileCount +
      Math.floor((level - 1) / 3) +
      (skill.synergyId ? (getSynergyModifiers(skill.synergyId).projectileBonus ?? 0) : 0),
    radius: def.radius * radiusMultiplier,
    speed: def.projectileSpeed,
  };
}

export function hasAugment(skill: SkillInstance, level: 3 | 7 | 10): boolean {
  return skill.augmentsUnlocked[level] !== undefined;
}

export function unlockAugment(skill: SkillInstance, level: 3 | 7 | 10): void {
  const def = getSkillDefinition(skill.id);
  if (!def) return;
  const augment = def.augments.find((entry) => entry.level === level);
  if (!augment) return;
  skill.augmentsUnlocked[level] = `${skill.id}_${level}`;
}
