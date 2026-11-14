import type { SynergyId, SynergyRecipe, SkillFlag, SkillModifiers } from '@/types/game';

/** 5 парных и 3 тройных слияния. Условие: все компоненты >= minLevel. */
export const SYNERGY_RECIPES: readonly SynergyRecipe[] = [
  {
    id: 'susanooKunai',
    name: 'Громовые Кинжалы Сусаноо',
    description: 'Кунаи вызывают цепную молнию, а при рикошете бьют громом по области.',
    ingredients: ['kunai', 'lightning'],
    minLevel: 5,
    result: {
      id: 'susanooKunai',
      name: 'Громовые Кинжалы Сусаноо',
      description: 'Кунаи вызывают цепную молнию, а при рикошете бьют громом по области.',
      flags: ['lightningConductors', 'homingRicochet'],
      modifiers: { damageMultiplier: 1.6, cooldownMultiplier: 0.8, projectileBonus: 1 },
    },
  },
  {
    id: 'amaterasuDiscs',
    name: 'Солнечные Диски Аматэрасу',
    description: 'Сюрикены становятся пылающими пилами, оставляющими огненное кольцо.',
    ingredients: ['shuriken', 'fireball'],
    minLevel: 5,
    result: {
      id: 'amaterasuDiscs',
      name: 'Солнечные Диски Аматэрасу',
      description: 'Сюрикены становятся пылающими пилами, оставляющими огненное кольцо.',
      flags: ['orbitOuterRing', 'fireLavaPool'],
      modifiers: { damageMultiplier: 1.7, radiusMultiplier: 1.25 },
    },
  },
  {
    id: 'crimsonMoon',
    name: 'Танец Алой Луны',
    description: 'Каждый взмах катаны выстреливает веером из 12 кровавых игл с вампиризмом.',
    ingredients: ['katana', 'senbon'],
    minLevel: 5,
    result: {
      id: 'crimsonMoon',
      name: 'Танец Алой Луны',
      description: 'Каждый взмах катаны выстреливает веером из 12 кровавых игл с вампиризмом.',
      flags: ['senbonLifesteal', 'katanaBleed'],
      modifiers: { damageMultiplier: 1.8, projectileBonus: 6 },
    },
  },
  {
    id: 'chemicalApocalypse',
    name: 'Химический Апокалипсис',
    description: 'Печать в дыму детонирует все облака на экране гигантским ядовито-огненным взрывом.',
    ingredients: ['smoke', 'seals'],
    minLevel: 5,
    result: {
      id: 'chemicalApocalypse',
      name: 'Химический Апокалипсис',
      description: 'Печать в дыму детонирует все облака на экране гигантским ядовито-огненным взрывом.',
      flags: ['sealChain', 'smokeSlowAmp'],
      modifiers: { damageMultiplier: 1.9, radiusMultiplier: 1.4 },
    },
  },
  {
    id: 'shinigamiHeralds',
    name: 'Посланники Синигами',
    description: 'Вороны накладывают Печать Жнеца и казнят цели ниже 25% HP.',
    ingredients: ['crows', 'reaper'],
    minLevel: 5,
    result: {
      id: 'shinigamiHeralds',
      name: 'Посланники Синигами',
      description: 'Вороны накладывают Печать Жнеца и казнят цели ниже 25% HP.',
      flags: ['reaperMassExecute', 'crowDarkRaven'],
      modifiers: { damageMultiplier: 1.6, cooldownMultiplier: 0.75 },
    },
  },
  {
    id: 'thousandBlades',
    name: 'Армия Тысячи Клинков',
    description: '4 теневых двойника бегают вокруг и стреляют утроенными самонаводящимися кунаями.',
    ingredients: ['kunai', 'shadowClone', 'mirror'],
    minLevel: 5,
    result: {
      id: 'thousandBlades',
      name: 'Армия Тысячи Клинков',
      description: '4 теневых двойника бегают вокруг и стреляют утроенными самонаводящимися кунаями.',
      flags: ['cloneMirrorShots', 'homingRicochet'],
      modifiers: { damageMultiplier: 1.8, cooldownMultiplier: 0.7, projectileBonus: 4 },
    },
  },
  {
    id: 'heavenDragonStorm',
    name: 'Шторм Небесного Дракона',
    description: 'Ледяной шторм замораживает экран, драконы бьют замороженных тройным критом.',
    ingredients: ['iceFan', 'waterDragon', 'lightning'],
    minLevel: 5,
    result: {
      id: 'heavenDragonStorm',
      name: 'Шторм Небесного Дракона',
      description: 'Ледяной шторм замораживает экран, драконы бьют замороженных тройным критом.',
      flags: ['iceFreeze', 'lightningConductors', 'waterTriple'],
      modifiers: { damageMultiplier: 2.0, radiusMultiplier: 1.3 },
    },
  },
  {
    id: 'shogunGrinder',
    name: 'Железная Мясорубка Сёгуна',
    description: 'Цепи стягивают всех врагов на минное поле из шипов и копий.',
    ingredients: ['kusarigama', 'makibishi', 'bamboo'],
    minLevel: 5,
    result: {
      id: 'shogunGrinder',
      name: 'Железная Мясорубка Сёгуна',
      description: 'Цепи стягивают всех врагов на минное поле из шипов и копий.',
      flags: ['chainPull', 'makibishiPercentHp', 'bambooGrid'],
      modifiers: { damageMultiplier: 2.2, radiusMultiplier: 1.5 },
    },
  },
];

const SYNERGY_BY_ID = new Map<SynergyId, SynergyRecipe>(SYNERGY_RECIPES.map((r) => [r.id, r]));

export function getSynergyRecipe(id: SynergyId): SynergyRecipe | undefined {
  return SYNERGY_BY_ID.get(id);
}

export function getSynergyFlags(id: SynergyId): readonly SkillFlag[] {
  return SYNERGY_BY_ID.get(id)?.result.flags ?? [];
}

export function getSynergyModifiers(id: SynergyId): Partial<SkillModifiers> {
  return SYNERGY_BY_ID.get(id)?.result.modifiers ?? {};
}

export interface ActiveSkillLike {
  id: string;
  level: number;
}

/** Рецепты, где все компоненты есть и прокачаны до minLevel. */
export function getAvailableSynergies(activeSkills: readonly ActiveSkillLike[]): SynergyRecipe[] {
  const levels = new Map<string, number>();
  for (const skill of activeSkills) levels.set(skill.id, Math.max(levels.get(skill.id) ?? 0, skill.level));
  return SYNERGY_RECIPES.filter(
    (recipe) => recipe.ingredients.every((ingredient) => (levels.get(ingredient) ?? 0) >= recipe.minLevel),
  );
}
