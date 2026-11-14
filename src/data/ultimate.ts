import type { UltimateConfig } from '@/types/game';

/** Настройки ульты «Оги: Небесный Вихрь Теней». */
export const ULTIMATE_CONFIG: UltimateConfig = {
  passiveChargeSeconds: 35,
  ascendDuration: 0.3,
  barrageDuration: 3.0,
  descendDuration: 0.45,
  kunaiInterval: 0.06,
  slashInterval: 0.15,
  bonusPerMarkedKill: 0.25,
  maxBonusTime: 2.0,
  ascendScale: 1.3,
  cameraZoom: 0.9,
  landingRadius: 220,
  landingDamage: 60,
  stunDuration: 1.2,
};

export const ULT_CHARGE_PER_DAMAGE = 0.02;
export const ULT_UNLOCK_LEVEL = 50;
