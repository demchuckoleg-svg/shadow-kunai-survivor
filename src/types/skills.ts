/**
 * Контракты скиллов, аугментаций 3/7/10, синергий и ультимейта.
 * Зависимости: нет.
 */

export type SkillId =
  | 'kunai'
  | 'shuriken'
  | 'katana'
  | 'smoke'
  | 'seals'
  | 'kusarigama'
  | 'lightning'
  | 'senbon'
  | 'fireball'
  | 'shadowClone'
  | 'makibishi'
  | 'iceFan'
  | 'crows'
  | 'ghostDash'
  | 'lantern'
  | 'bamboo'
  | 'oniMask'
  | 'waterDragon'
  | 'mirror'
  | 'reaper';

export type AugmentLevel = 3 | 7 | 10;

/** Поведение каста: определяет, какая система обрабатывает скилл. */
export type SkillBehavior =
  | 'projectile'
  | 'orbit'
  | 'meleeArc'
  | 'zone'
  | 'chain'
  | 'summon'
  | 'aura'
  | 'dash'
  | 'portal'
  | 'mark';

/** Механические теги, включающие аугментации и эффекты синергий. */
export type SkillFlag =
  // Кунаи Тьмы
  | 'pierceBonus'
  | 'fanVolley'
  | 'homingRicochet'
  // Вихрь Сюрикенов
  | 'orbitWidePush'
  | 'orbitCritLaunch'
  | 'orbitOuterRing'
  // Рассечение Катаной
  | 'katanaBackSlash'
  | 'katanaBleed'
  | 'katanaEnergyWave'
  | 'katanaTripleCross'
  // Ядовитая Дымовая Бомба
  | 'smokeSlowAmp'
  | 'smokeOnDeath'
  | 'smokeClones'
  // Взрывные Печати
  | 'sealIgnite'
  | 'sealInstantOnKill'
  | 'sealChain'
  // Цепь Кусаригамы
  | 'chainStun'
  | 'chainPull'
  | 'chainWhirl'
  // Молния Райдзина
  | 'lightningExtraJumps'
  | 'lightningThunderArea'
  | 'lightningConductors'
  // Кровавый Сенбон
  | 'senbonArmorPierce'
  | 'senbonBloodBurst'
  | 'senbonLifesteal'
  // Катон: Огненный Шар
  | 'fireLavaPool'
  | 'fireSplit'
  | 'fireMeteorPull'
  // Теневой Двойник
  | 'cloneShoots'
  | 'cloneDouble'
  | 'cloneMirrorShots'
  // Шипы Макибиси
  | 'makibishiSlowShred'
  | 'makibishiNeedleBurst'
  | 'makibishiPercentHp'
  // Ледяной Веер Тэссэн
  | 'iceFreeze'
  | 'iceCritVuln'
  | 'iceDeathShards'
  | 'iceFullCircle'
  // Стая Воронов Карасу
  | 'crowExtra'
  | 'crowCollectXp'
  | 'crowDarkRaven'
  // Рывок Призрака
  | 'dashIframes'
  | 'dashShadowBlades'
  | 'dashChainTeleport'
  // Духовный Фонарь
  | 'lanternXpMagnet'
  | 'lanternSoulLights'
  | 'lanternSoulAura'
  // Бамбуковая Ловушка
  | 'bambooLaunch'
  | 'bambooWall'
  | 'bambooGrid'
  // Проклятая Маска Они
  | 'oniLowHpCdr'
  | 'oniReflect'
  | 'oniBerserk'
  // Суйтон: Водяной Дракон
  | 'waterPushLine'
  | 'waterReturn'
  | 'waterTriple'
  // Зеркало Иллюзий
  | 'mirrorDuplicate'
  | 'mirrorBiggerShots'
  | 'mirrorRing'
  // Печать Жнеца
  | 'reaperJump'
  | 'reaperExplodeHeal'
  | 'reaperMassExecute';

export interface SkillModifiers {
  damageMultiplier: number;
  cooldownMultiplier: number;
  projectileBonus: number;
  radiusMultiplier: number;
}

export const BASE_MODIFIERS: SkillModifiers = {
  damageMultiplier: 1,
  cooldownMultiplier: 1,
  projectileBonus: 0,
  radiusMultiplier: 1,
};

export interface AugmentDefinition {
  level: AugmentLevel;
  name: string;
  description: string;
  flags: readonly SkillFlag[];
  modifiers?: Partial<SkillModifiers>;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  behavior: SkillBehavior;
  /** Цвет эффекта, 0xRRGGBB. */
  color: number;
  baseDamage: number;
  /** Секунды. */
  baseCooldown: number;
  projectileCount: number;
  projectileSpeed: number;
  radius: number;
  pierce: number;
  homing: boolean;
  ricochet: number;
  /** Ровно три аугментации: 3, 7 и 10 уровень. */
  augments: readonly [AugmentDefinition, AugmentDefinition, AugmentDefinition];
}

export interface SkillInstance {
  id: SkillId;
  /** 1..10 */
  level: number;
  cooldownTimer: number;
  /** Уровень аугментации -> её id. */
  augmentsUnlocked: Partial<Record<AugmentLevel, string>>;
  isEvolved: boolean;
  evolvedFrom: readonly SkillId[];
  /** Если скилл — результат слияния, здесь его рецепт. */
  synergyId: SynergyId | null;
  totalDamageDealt: number;
  hitCount: number;
  critCount: number;
}

/* ============================ Синергии ============================ */

export type SynergyId =
  | 'susanooKunai'
  | 'amaterasuDiscs'
  | 'crimsonMoon'
  | 'chemicalApocalypse'
  | 'shinigamiHeralds'
  | 'thousandBlades'
  | 'heavenDragonStorm'
  | 'shogunGrinder';

export interface SynergyResult {
  id: SynergyId;
  name: string;
  description: string;
  flags: readonly SkillFlag[];
  modifiers: Partial<SkillModifiers>;
}

export interface SynergyRecipe {
  id: SynergyId;
  name: string;
  description: string;
  /** 2 или 3 компонента; все должны быть >= minLevel. */
  ingredients: readonly [SkillId, SkillId] | readonly [SkillId, SkillId, SkillId];
  minLevel: number;
  result: SynergyResult;
}

/* ========================== Ультимейт =========================== */

export type UltimatePhase = 'IDLE' | 'ASCEND' | 'BARRAGE' | 'DESCEND';

export interface UltimateState {
  phase: UltimatePhase;
  /** Таймер текущей фазы, сек. */
  timer: number;
  /** Остаток фазы BARRAGE, сек. */
  barrageTimer: number;
  /** Добавленное продлениями время, сек (лимит maxBonusTime). */
  bonusTimeUsed: number;
  /** id врага под алой меткой, -1 если нет. */
  primaryTargetId: number;
  kunaiTimer: number;
  slashTimer: number;
  active: boolean;
}

export interface UltimateConfig {
  passiveChargeSeconds: number;
  ascendDuration: number;
  barrageDuration: number;
  descendDuration: number;
  kunaiInterval: number;
  slashInterval: number;
  bonusPerMarkedKill: number;
  maxBonusTime: number;
  ascendScale: number;
  cameraZoom: number;
  landingRadius: number;
  landingDamage: number;
  stunDuration: number;
}
